# Clean-sheet DynamoDB access patterns and invariants

_Research date: 2026-09-21. Primary sources are the pinned Takonbini API commit `f097a6f`, the pinned Takonbini Web commit `7c11530`, and the confirmed Wayfinder map. This note inventories behavior; it deliberately does not choose table keys, indexes, transactions, or a search provider._

## Decision

The clean-sheet model must preserve a small set of identities and conditional state changes, while offering three distinct read surfaces:

1. an internal, resumable per-store weekly refresh workflow;
2. an authoritative versioned catalog with one active generation pointer per store; and
3. public product detail and browse reads from DynamoDB, with multilingual free-text search delegated to a rebuildable generation-scoped projection.

MongoDB collections, aggregation pipelines, regular expressions, BSON wrappers, and index shapes are not requirements. The requirements are the observable guarantees they currently implement: deterministic/idempotent writes, compare-and-set state changes, expiring renewable leases, complete-generation publication, snapshot-safe pagination, reusable translations, bounded retention, and graceful browse when search is unavailable. The parent map adds clean-start lifecycle rules and richer search/sort behavior. [Confirmed Wayfinder map](https://github.com/seancheong/takonbini-web/issues/36), [current workflow contracts](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/contracts.ts), [current repository behavior](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/repositories.ts)

## Required identities

These are logical identities that future key design must make cheap and unambiguous:

| Entity | Logical identity | Why it is required |
| --- | --- | --- |
| Refresh run | `(store, JST week start)` | Replaying the same weekly event resumes one run rather than creating duplicates. A blocked retry increments the attempt while retaining the weekly run identity. |
| Discovery manifest | `(run, attempt, canonical content digest)` | Discovery is frozen, ordered, deduplicated, and content-addressed before detail processing. |
| Chunk | `(manifest, deterministic ordinal)` | A bounded slice can be leased, retried, completed, and resumed independently. |
| Candidate generation | `manifest -> one generation` | Products stay private until the frozen candidate is complete and verified. |
| Generation product | `(generation, product ID)` | The same product may exist in successive immutable generations without overwriting the active catalog. |
| Store publication | `store` plus monotonic version | Exactly one generation is active per store; version enables compare-and-set publication and cursor snapshots. |
| Translation | hash of `(policy version, store, product ID, Japanese title, Japanese description)` | An unchanged Japanese source reuses a translation across generations; changed source text cannot reuse stale localized text. |
| Translation failure | `(generation, product ID)` | A failed translation falls back to Japanese and permits one bounded post-publication recovery attempt. |
| Store lease | `store` | Only one owner may execute store-sensitive processing/publication at a time. |
| Terminal summary | `(run, attempt)` | Terminal telemetry is write-once and retry-safe. |
| Alert | deterministic alert identity | Duplicate delivery must not emit duplicate alerts. |

The identities and state fields above are explicit in the current contracts and repository guards; manifest canonicalization, its 5% invalid/duplicate gate, its 70% previous-count gate, and deterministic chunk derivation are implemented separately. [workflow contracts](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/contracts.ts), [manifest creation](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/manifest.ts), [translation identity](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/translation.ts)

## Internal workflow access patterns

### Run and discovery

| Operation | Lookup/query | Write/condition | Ordering or bound |
| --- | --- | --- | --- |
| Start or resume weekly run | Get by `(store, week)` | Create only if absent; an existing record must have the same store/week identity | One record |
| Read current run | Get by run ID | None | One record |
| Transition run | Get/condition by run ID | Compare expected `state` and `revision`; allow only the declared state graph; attach only a manifest/generation belonging to that run | One record |
| Restart blocked discovery | Get by run ID | CAS `blocked -> discovering`, increment attempt, clear stale manifest/generation pointers | One record |
| Save frozen manifest | Get/put by manifest ID | Put-if-absent; retry must be content-equivalent (creation timestamp may differ) | One manifest; product list is deterministically sorted |
| Resume current attempt | Query manifests by `(run, attempt)` | None | Deterministic first match; clean-sheet design should enforce at most one |
| Save chunks | Put each `(manifest, ordinal)` | Put-if-absent and content-equivalent | Current size is 100 products, but only bounded deterministic partitioning is invariant |

The state graph is `discovering -> processing -> ready -> published`, with `blocked` reachable from pre-publication states and restartable only to discovery. Processing requires the current attempt's frozen manifest; ready requires its complete generation; published requires the store pointer already selecting that generation. [repository transitions](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/repositories.ts), [Phase 1 workflow guide](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/docs/phase-1-store-refresh.md)

### Chunk and store leases

| Operation | Lookup/query | Write/condition | Ordering or bound |
| --- | --- | --- | --- |
| List manifest chunks | Query by manifest | None | Ascending ordinal; coverage must exactly reproduce the frozen manifest |
| List runnable chunks | Query by manifest and retry eligibility | None | Pending/failed, or leased with expired deadline; fewer than 3 attempts; ascending ordinal |
| Acquire chunk lease | Get by chunk ID | Conditional update only when retryable; set owner/deadline and increment attempts/revision | One chunk |
| Renew/complete/fail chunk | Get by chunk ID | Require leased state, same owner, expected revision, and unexpired deadline | One chunk |
| Acquire store lease | Get by store | Create if absent or take only when expired; set owner/deadline and advance fencing revision | One store |
| Renew/release store lease | Get by store | Require same owner, expected revision, and unexpired deadline | One store |

Lease ownership alone is insufficient: revision plus expiry act as fencing conditions, so a stale worker cannot complete after losing its lease. Processing is resumable because completed chunks are skipped, expired leases are recoverable, detail fetches are retried at most three times, workers are bounded to 1–4, and an exhausted chunk blocks the run instead of publishing partial output. [bounded processor](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/processing.ts), [lease repository operations](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/repositories.ts)

### Candidate products, translations, and recovery

| Operation | Lookup/query | Write/condition | Ordering or bound |
| --- | --- | --- | --- |
| Start/read generation | Get by generation ID; list by run for recovery/retention | Create empty candidate only if absent and identity-equivalent | Normally one per manifest |
| Save generation product | Put by `(generation, product)` | Generation must still be `candidate`; retry must be identical | One item |
| Resume product processing | Get generation product by identity | None | One item |
| Verify generation | Query all products by generation | Require exact frozen IDs, store/URL identity, valid detail fields, complete chunks, exact count, unique IDs, and canonical source-product digest | Stable product-ID ordering |
| Complete generation | Get by generation ID | CAS candidate/revision to complete with positive count and digest | One item |
| Reuse/store translation | Get/put by source identity | Put-if-absent and content-equivalent; independently retained across product generations | One item |
| Record translation miss | Get/put by `(generation, product)` | Put-if-absent; identity must agree; serve Japanese fallback | One item |
| Recover misses | Query pending failures by generation | Claim `pending -> exhausted` once; after successful product rewrite mark `recovered` | Product-ID order; one bounded pass |

Candidate validation intentionally hashes the Japanese source product rather than localized output, so translation outage/fallback does not make catalog identity unstable. Successful translations are a reusable cache with an independent non-TTL lifecycle under the map's confirmed requirements. [candidate generation](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/candidate-generation.ts), [translation workflow](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/translation.ts), [confirmed lifecycle constraints](https://github.com/seancheong/takonbini-web/issues/36)

### Publication and retention

| Operation | Lookup/query | Write/condition | Ordering or bound |
| --- | --- | --- | --- |
| Read active generation | Get publication by store | None | One pointer per store |
| Publish candidate | Read run, manifest, every chunk, generation, generation products, current pointer, and prior run | Under store lease, CAS pointer from expected version/generation to next version/generation | One authoritative pointer write is the visibility boundary |
| Finish interrupted publication | Read pointer, generation, run | If pointer already selects candidate, idempotently finish generation/run bookkeeping | Retry-safe after pointer write |
| Reject stale publication | Compare current and candidate run weeks | Do not replace with same-week or older generation | Store-local monotonic time |
| Retain previous generation | Read previous pointer/generation | Mark previous generation retained and schedule expiry after successor publication | Current generation never expires merely because a run terminates |
| Schedule workflow retention | Query artifacts by run/generation | Add expiry only after run is terminal; exclude active generation; preserve successful translations | Details currently 35 days; summaries/alerts currently 90 days |
| Determine freshness | Get publication by store | None | warning at day 8, escalated at day 15, expired at day 28; expired stores are hidden |

Publication is safe only if the frozen manifest, exact chunk coverage, complete candidate, source digest, ready run, and (per the new map) complete version-matched search projection all agree before the pointer changes. The pointer change, not copying individual products, atomically exposes a store generation. Current tests prove stale CAS rejection, no partial publication, retry after interruption immediately following the pointer write, previous-generation retention, and whole-store switching without generation mixing. [publication service](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/src/refresh/publication.ts), [publication integration test](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/scraper/tests/store-publication-repositories.integration.ts), [search publication gate](https://github.com/seancheong/takonbini-web/issues/36)

## Public catalog access patterns

### Authoritative DynamoDB reads

| Operation | Required behavior |
| --- | --- |
| Load publication snapshot | Read all three store pointers, accept only structurally valid, unexpired publications, and derive a snapshot identity from `(store, version/generation)` pairs. |
| Get product detail | Resolve product ID only within currently active, fresh store generations; unpublished, superseded, inactive, or expired-store products return not found. |
| Browse active products | Read across one or more active store generations, with optional multi-select store, category, and region filters; optional price range; and `new`, `soon`, `all`, or default `allWithoutSoon` status interpreted using the JST date. |
| Sort browse results | The current default is `isNew` descending, then products with release dates first, release date descending, and product ID ascending as the deterministic tie-breaker. The confirmed destination additionally requires user-selectable price and recency ordering. |
| Paginate browse | Return a bounded page (the web currently defaults to 20) and an opaque continuation token carrying enough per-query position and publication snapshot state to prevent duplicates, skips, or cross-generation mixing. A changed snapshot invalidates/ends the old cursor. |
| Degraded browse | Store/category browse must continue directly from DynamoDB when the free-text projection is unavailable. |

The current API already treats candidate and expired generations as invisible and binds generation-mode cursors to a hash of active store/generation pairs. Its filters are part of the browser-visible contract: the web exposes search, multi-store, multi-category, multi-region, price bounds, future-release inclusion, pagination, and detail-by-ID. [generation catalog source](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/api/src/lib/generationCatalogSource.ts), [API product service](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/api/src/services/productService.ts), [catalog contract test](https://github.com/seancheong/takonbini-api/blob/f097a6fb7cea4d8767b00413b92cc37483fd4f8f/services/api/src/services/catalogReadContract.integration.test.ts), [web product requests](https://github.com/seancheong/takonbini-web/blob/7c11530a0547adcf1690df750d099679ce273bd8/src/services/productService.ts)

### Search projection reads and writes

The projection must be rebuildable entirely from an authoritative completed generation. Index writes therefore need `(store, generation, product)` identity and must never mutate an already published projection in a way that mixes generations. Before publication, the workflow needs a completeness check proving the projection version matches the candidate and covers its searchable products. At query time it must support Japanese, English, and Chinese fields; prefix/partial matching; typo tolerance; store/category filters; relevance, price, and recency ordering; and opaque pagination. Search hits must be intersected with the current publication snapshot (or otherwise be inherently version-scoped), so stale hits cannot reveal superseded products. Facet counts are not required. [confirmed search contract](https://github.com/seancheong/takonbini-web/issues/36)

## Clean-start product lifecycle access patterns

The new design needs lifecycle state not present in the current Mongo model:

- On each **successful** store observation, compare the prior active generation with the new frozen generation. Reset an observed product's consecutive-absence count; increment an absent product's count exactly once for that successful weekly observation. Failed or blocked refreshes perform neither change.
- After two consecutive successful weekly absences, remove the product from public browse/search immediately by marking it inactive or omitting it from the newly published active generation.
- Retain the inactive authoritative record for 30 days, then make it eligible for automatic TTL deletion. DynamoDB TTL timing is cleanup behavior, not the visibility boundary.
- Keep successful translations independently; deleting an inactive product must not delete its translation identity.

These lifecycle rules are explicit map decisions and must be represented as conditional, idempotent writes so replaying a successful weekly publication cannot double-increment absence. [confirmed lifecycle rules](https://github.com/seancheong/takonbini-web/issues/36)

## Invariants versus replaceable MongoDB mechanics

### Preserve

- Store/JST-week idempotency; deterministic manifest, chunk, product, translation, summary, and alert identities.
- Immutable discovery and candidate content once written, with conflict detection on mismatched retries.
- Explicit state machines and optimistic revisions for every competing transition.
- Renewable expiring leases with ownership and fencing; stale owners cannot commit.
- Bounded retries/concurrency and resume from completed chunks.
- Candidate isolation and a single store-local publication pointer as the visibility boundary.
- Complete frozen-manifest coverage, count, uniqueness, identity, and digest checks before publication.
- Publication monotonicity, CAS race rejection, and idempotent recovery after an interrupted pointer write.
- Active-generation-only detail/browse/search; no partial, superseded, stale, or cross-generation result sets.
- Opaque stable pagination tied to the publication snapshot.
- Japanese fallback plus separately reusable source-identity translations.
- Terminal-only retention scheduling, deduplicated alerts, freshness policy, and secrets/product-text exclusion from telemetry.
- The newly confirmed two-successful-absence/30-day inactive lifecycle and search-projection publication gate.

### Replace or re-decide

- Eleven MongoDB collections and their `{ _id, value, expiresAt }` envelope.
- Mongo query/aggregation syntax (`$in`, `$or`, regex, `$replaceRoot`, computed sort fields) and Mongo secondary-index layouts.
- `findOneAndUpdate` specifically; DynamoDB conditional writes/transactions need only reproduce the CAS outcome.
- Mongo's TTL monitor specifically; DynamoDB TTL may delete later, while query-visible state must change synchronously.
- Chunk size `100`, retry count `3`, lease durations, worker default, and the 35/90-day workflow telemetry periods are current operating parameters, not domain truths. Keep them as initial compatibility defaults unless a later ticket changes them.
- The exact default sort encoding and continuation-token representation. Preserve stable ordering/snapshot safety, not Mongo's tuple or base64 JSON format.
- Regex against `searchKeywords`. The new multilingual search contract is intentionally broader and belongs to the projection design.
- Reading all generation products into memory for verification or fan-out merging all browse partitions in the API. Those are implementation choices subject to the RM1/month cost and bounded-work constraints.

## Implications for the next design tickets

1. Key design should start from the operation tables above, not from entity names or the retired DynamoDB schema.
2. Separate workflow write paths from public browse paths if that materially reduces GSIs or write amplification; duplication is acceptable when generation-scoped and rebuildable.
3. Every proposed GSI must name the exact access pattern it serves. A filter expression after a broad DynamoDB query does not satisfy bounded pagination or the below-RM1 cost constraint.
4. Table/transaction design must explicitly show the publication linearization point, lease fencing conditions, replay behavior for absence counters, and how a cursor captures multiple store positions when a browse spans partitions.
5. Search design must show generation scoping and completeness proof before publication, plus direct DynamoDB store/category browse during search failure.

This inventory resolves **what** the storage model must support. It intentionally leaves table count, keys, GSIs/LSIs, transactional grouping, search provider, and projection representation to their dedicated Wayfinder decisions.
