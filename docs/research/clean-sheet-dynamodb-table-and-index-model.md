# Clean-sheet DynamoDB table and index model

_Decision date: 2026-09-21. This is a decision-complete storage specification, not a production implementation._

## Decision

Use three single-Region DynamoDB tables in `ap-northeast-1`:

1. **Catalog** owns immutable Catalog Generations, authoritative generation products, store publication pointers, Browse Projections, Search Projections, and product lifecycle records.
2. **Refresh** owns weekly run state, frozen discovery manifests, deterministic chunks, leases, translation misses, alerts, terminal summaries, and cleanup progress.
3. **Translations** owns independently retained Product Translations keyed by source identity.

All production request paths use the base-table primary keys. The design has no local secondary indexes (LSIs), no global secondary indexes (GSIs), and no request-path scans. Structured browsing uses deterministic materialized Browse Projection entries. Multilingual free-text search uses the previously approved generation-scoped MiniSearch projection. DynamoDB remains authoritative.

This replaces the historical one-table/four-GSI Terraform shape as a design constraint. That table is evidence of an earlier approach only.

## Inputs

- [Wayfind the clean-sheet DynamoDB catalog migration](https://github.com/seancheong/takonbini-web/issues/36)
- [Choose the DynamoDB product lifecycle model](https://github.com/seancheong/takonbini-web/issues/38)
- [Clean-sheet DynamoDB access patterns and invariants](https://github.com/seancheong/takonbini-web/blob/42f3dbf4cd87819a416ab352d00c463bd8b0053b/docs/research/dynamodb-access-patterns-and-invariants.md)
- [Multilingual product search below RM1 per month](https://github.com/seancheong/takonbini-web/blob/8e03581/docs/research/dynamodb-search-below-rm1.md)
- [Merged multilingual search prototype](https://github.com/seancheong/takonbini-api/pull/37) and [Tokyo DynamoDB measurement](https://github.com/seancheong/takonbini-api/pull/38)

## Why three tables

The three data groups have materially different lifecycles and failure modes:

- Catalog reads are visitor-facing, snapshot-bound, and correctness-sensitive.
- Refresh state is write-heavy, leased, retryable, and aggressively retained.
- Product Translations outlive both workflow artifacts and inactive products.

A single table would couple workflow keys, TTL policy, IAM access, and future capacity changes to public reads. Two tables would still couple permanent translations to short-lived refresh control data. Three tables create explicit ownership without adding a recurring per-table charge; capacity mode, alarms, backups, and the sub-RM1 envelope remain decisions for #39.

## DynamoDB constraints shaping the model

- One DynamoDB item is limited to 400 KB, including attribute names. Transactions are limited to 100 unique items and 4 MB. [AWS DynamoDB constraints](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html)
- Strongly consistent `GetItem`, `BatchGetItem`, and `Query` reads are available on base tables, while GSI reads are eventually consistent. [AWS read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html)
- `FilterExpression` runs after a query reads items and does not replace a key condition. A query may return no items plus a continuation key when all evaluated items were filtered. [AWS Query API](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html)
- `BatchWriteItem` is not atomic as a whole, cannot perform conditional creates, and returns unprocessed items that must be retried with backoff. [AWS BatchWriteItem API](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html)
- `TransactGetItems` atomically retrieves up to 100 base-table items and provides one consistent view across those items. [AWS TransactGetItems API](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactGetItems.html)
- TTL is per item and expired items can remain readable for days before background deletion. [AWS DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)

These constraints rule out a transaction over an entire generation, a parent-item TTL that cascades to generation children, conditional immutable writes through `BatchWriteItem`, and GSI-backed strongly consistent publication reads.

## Shared conventions

The Catalog and Refresh tables use string partition and sort keys named `PK` and `SK`. Key components are canonical, escaped, length-bounded strings. Numeric ordering components use fixed-width encodings. Timestamps used for ordering are normalized UTC instants; business-week and product-status decisions remain explicitly JST-based.

All immutable artifacts include:

- a format version;
- their logical identity;
- a SHA-256 digest of canonical content;
- a creation timestamp for evidence, excluded from content identity; and
- counts needed to reconcile their child items.

Mutable control items carry a monotonic `revision`. Every competing update supplies the expected state and revision. Lease updates additionally require the expected owner, fencing revision, and an unexpired deadline.

## Catalog table

### Key families

| Entity | PK | SK | Important attributes |
| --- | --- | --- | --- |
| Store publication | `STORE#<store>` | `PUBLICATION` | `version`, `generationId`, `previousGenerationId`, `publishedAt`, successful-observation time, generation/browse digests |
| Generation metadata | `GEN#<store>#<generation>` | `META` | state, run/manifest identity, counts, aggregate digests, target search-snapshot identity/digest, cleanup state |
| Authoritative product | `GEN#<store>#<generation>` | `PRODUCT#<productId>` | complete product contract plus source identity |
| Staged lifecycle transition | `GEN#<store>#<generation>` | `LIFECYCLE_DELTA#<productId>` | previous/next lifecycle state plus store/week publication identity |
| Browse manifest header | `GEN#<store>#<generation>` | `BROWSE#MANIFEST` | partition count, entry count, digest, segment count |
| Browse manifest segment | `GEN#<store>#<generation>` | `BROWSE#MANIFEST#SEGMENT#<ordinal>` | ordered browse partition identities and counts |
| Search snapshot metadata | `SNAPSHOT#<snapshotId>` | `META` | state, exact three pointer versions/generations, search digest, cleanup state |
| Search manifest | `SNAPSHOT#<snapshotId>` | `SEARCH#MANIFEST` | format/library version, chunk/byte/document counts, checksum |
| Search chunk | `SNAPSHOT#<snapshotId>` | `SEARCH#CHUNK#<ordinal>` | DynamoDB Binary projection bytes, at most 350 KiB decoded |
| Browse entry | `BROWSE#<store>#<generation>#C#<category-or-ALL>#R#<region-or-ALL>#O#<order>` | `<normalized-order-tuple>#PRODUCT#<productId>` | product card projection and filter fields |
| Product lifecycle | `PRODUCT#<store>#<productId>` | `LIFECYCLE` | compact canonical Lifecycle Episode: state, consecutive-successful-absence count, episode identity, revision, last-applied observation identity, inactivity time, optional logical-expiry time |

`<order>` is one of `RECENCY_DESC`, `PRICE_ASC`, or `PRICE_DESC`. Separate normalized encodings preserve product-ID ascending as the deterministic tie-breaker for every direction. `RECENCY_DESC` encodes `isNew` descending, known release dates before missing dates, release date descending, then product ID ascending. Status filtering still evaluates the JST request date because `soon` and other time-relative states cannot be frozen into an immutable ordering key.

### Browse materialization

For each product, write each ordering form into these dimensions:

- category `ALL`, region `ALL`;
- exact category, region `ALL`;
- category `ALL`, each applicable exact region; and
- exact category, each applicable exact region.

This is deterministic, generation-scoped duplication, not another authoritative product copy. Each entry contains only fields needed to return a catalog card and evaluate dynamic price/status rules.

The request planner selects the narrowest exact partitions. Multi-select store/category/region filters fan out to at most 24 partition queries. If an exact plan exceeds 24, the planner chooses a broader materialized dimension and filters in application memory. It evaluates at most 400 candidate entries per request and never falls back to `Scan`.

Price bounds use sort-key ranges when the selected order is price. Other cross-order constraints, including time-relative `new` and `soon` status, are evaluated from projection attributes within the 400-candidate budget.

The merge de-duplicates by product ID because a product available in multiple selected regions appears in more than one region partition. Every contributing partition position is consumed together so the same product cannot reappear on a later page.

The shared response contract contains up to 20 products, an optional cursor, and `exhausted`. Zero matches is a final empty state only when `exhausted` is true. A client receiving an empty page with `exhausted: false` continues from the returned cursor rather than rendering a zero-result state.

### Product detail

The public product URL need not encode a store. The API loads the three store publication pointers in one `TransactGetItems`, then sends one strongly consistent `BatchGetItem` containing at most three keys:

```text
GEN#<store>#<active-generation> / PRODUCT#<requested-product-id>
```

Only structurally valid and fresh publications participate. Exactly one product match is returned. No product-ID GSI is required. A duplicate product ID across stores is an integrity failure during generation validation.

### Sitemap enumeration

Strongly query each active generation partition with `begins_with(SK, "PRODUCT#")`. The three bounded queries enumerate only published, fresh products and remain tied to one Publication Snapshot.

### Free-text search

Derive `snapshotId` from the three ordered `(store, pointer version, generation ID)` tuples. Strongly read that Publication Snapshot's Search Projection manifest and ordered chunks on a cold load, verify pointer coverage, byte count, document count, and SHA-256 checksum, then deserialize and cache by snapshot identity. One snapshot-level projection gives global relevance, price, and recency ordering across stores and uses the already-prototyped single-index cursor behavior. If loading or querying the Search Projection fails, direct structured browse remains available.

#44 owns the exact coordination protocol that builds this immutable snapshot projection before a store pointer advances and makes the candidate generation's target search-snapshot identity agree with the resulting three-store Publication Snapshot.

The search prototype measured a 5,000-product conservative projection at 532,773 compressed bytes in two chunks; its Tokyo read-back consumed 132 strongly consistent read capacity units and passed checksum verification. Evidence is in [takonbini-api PR #38](https://github.com/seancheong/takonbini-api/pull/38).

## Refresh table

### Key families

| Entity | PK | SK | Operation shape |
| --- | --- | --- | --- |
| Weekly run head | `RUN#<store>#<JST-week>` | `HEAD` | exact get; conditional state/revision update |
| Manifest header | same run PK | `ATTEMPT#<n>#MANIFEST#<digest>` | create-if-absent; prefix query current attempt |
| Manifest segment | same run PK | `ATTEMPT#<n>#MANIFEST#<digest>#SEGMENT#<ordinal>` | ordered manifest-prefix query; immutable |
| Work chunk | same run PK | `ATTEMPT#<n>#CHUNK#<manifest-digest>#<ordinal>` | ordered chunk-prefix query; conditional lease/state update |
| Terminal summary | same run PK | `SUMMARY#<attempt>` | create-if-absent; optional `expiresAt` |
| Store lease | `LEASE#STORE#<store>` | `HEAD` | exact conditional get/update |
| Translation miss | `GEN#<store>#<generation>` | `TRANSLATION_MISS#<productId>` | bounded generation prefix query and conditional state update |
| Alert | `ALERT#<deterministic-id>` | `HEAD` | create-if-absent deduplication |
| Cleanup progress | `CLEANUP#GEN#<store>#<generation>` or `CLEANUP#SNAPSHOT#<snapshotId>` | `HEAD` | conditional state/cursor update |

The deterministic run identity is `(store, JST week start)`. The current attempt is stored on the run head. Frozen manifests are content-addressed and split into ordered immutable segments capped at 350 KiB. Work chunk ordinals derive from the canonical product ordering, not physical manifest segment boundaries.

Listing runnable chunks queries one run/attempt/manifest prefix and evaluates the bounded chunk set in memory. Chunk acquisition and completion update the exact chunk item conditionally; no status index is needed. A stale lease owner cannot commit because owner, fencing revision, expected state, and expiry are all conditions on the update.

Candidate Generation products live in the Catalog table from their first write but remain invisible because no store publication pointer selects them. Refresh records retain only their generation reference and validation evidence.

## Product lifecycle

The stable product identity is `(store, product ID)`. Its canonical lifecycle item is compact: it contains identity, the opaque Lifecycle Episode identity, `active` or `inactive` state, a consecutive-successful-absence count of `0`, `1`, or `2`, `revision`, `lastAppliedPublicationIdentity`, last-observed source identity, and optional `inactiveAt` / numeric `expiresAt`. It does not duplicate the complete product payload; authoritative payloads remain immutable generation products.

A new product starts an active Lifecycle Episode at absence `0`. For every accepted store observation period, candidate construction strongly reads the reconciled prior publication and relevant lifecycle items, then writes immutable `LIFECYCLE_DELTA` items bound to the candidate generation, prior episode/revision/state, and next state. The only ordinary transitions are:

| Prior condition | Resulting lifecycle | Candidate Generation membership |
| --- | --- | --- |
| first observation | active, absence `0`, new episode | include observed product |
| observed active product | active, absence `0` | include observed product |
| first successful absence | active, absence `1` | carry forward the prior authoritative product |
| second consecutive successful absence | inactive, absence `2`, set `inactiveAt` | omit product |
| observed inactive product before logical expiry | active, absence `0`, clear inactivity and expiry | include observed product |
| absent inactive product | unchanged | omit product |

Only a successfully published frozen generation is an observation. A failed, blocked, stale, duplicate, or safety-gated refresh never advances absence. Translation failure with approved Japanese fallback still counts as an observation because the source product is verified and published. The deterministic observation identity is `(store, JST week start)`; it may be applied once, and a later observation period must be strictly newer. Exact retries converge, while a materially different second publication for the same period is rejected from normal refresh and belongs to #44's repair or rollback protocol.

Logical expiry occurs at `inactiveAt + 30 days`, using the pointer transaction's committed publication time. TTL performs only physical cleanup. An item may remain physically stored after its deadline, but a reappearance at or after logical expiry conditionally replaces it with a new Lifecycle Episode; it never resumes the expired episode. Reappearance before that deadline reactivates the existing episode and removes its TTL attribute. A source-content change with the same store product ID remains in the same episode, while its Product Translation identity changes. Product Translations remain independently non-TTL.

Lifecycle state is not updated before public publication. The pointer transaction makes the already lifecycle-filtered candidate generation visible. Recovery then applies each staged delta conditionally: an exact already-applied result succeeds, an exact expected prior state advances, and a new/logically expired episode may be conditionally created or replaced. Any other mismatch is an integrity failure: reconciliation stops, the next store refresh remains blocked, and an alert is recorded. A generation records the lifecycle-delta count and digest; reconciliation completes only after deterministic batched application proves the same count and digest. Crash recovery always resumes forward from the selected published generation rather than automatically rolling it back.

## Translations table

The Translations table has a single string partition key named `PK` and no sort key:

```text
PK = TRANSLATION#<SHA-256(policy-version, store, product-id, Japanese-title, Japanese-description)>
```

The item stores the canonical source identity, policy version, Japanese source digest, English rendering, Chinese rendering, and creation evidence. Reads are exact `GetItem`; writes are conditional `PutItem`. Equivalent retries succeed after digest comparison, while conflicting content blocks the run. The table has no TTL, LSI, or GSI.

Translation misses and recovery state remain in Refresh because they are generation workflow, not reusable Product Translations.

## Immutable artifact protocol

Artifacts that may exceed DynamoDB's 400 KB limit use:

1. one immutable header with identity, format version, item/byte counts, segment count, and aggregate digest;
2. ordered immutable segments capped at 350 KiB; and
3. read-back reconciliation of segment coverage, counts, byte length, and digest before the parent becomes complete.

Each immutable item is written using `PutItem` with `attribute_not_exists(PK)` and `attribute_not_exists(SK)` where applicable. On a conditional conflict, the writer strongly reads the existing item: identical identity and digest make the retry successful; any difference is an integrity conflict that blocks the run.

`BatchWriteItem` is not used for immutable creation because it cannot apply create-if-absent conditions and can overwrite an existing key. It may be used for cleanup deletes; all `UnprocessedItems` are retried with jittered exponential backoff before cleanup progress advances.

## Publication protocol boundary

Unbounded work happens before the publication transaction:

1. write authoritative generation products;
2. compute the lifecycle-approved active set and immutable staged lifecycle transitions defined below;
3. build every Browse Projection entry and its manifest;
4. build the target Publication Snapshot's Search Projection chunks and manifest;
5. strongly read back and reconcile frozen product IDs, counts, identities, and aggregate digests; and
6. conditionally transition generation metadata from `candidate` to `complete`.

Lifecycle evaluation includes observed products and products carried forward after their first successful absence. It writes immutable `LIFECYCLE_DELTA` items but does not advance canonical lifecycle counters before publication. After the pointer transaction succeeds, recovery applies those deltas with episode, revision, and observation-identity conditions; replaying the same store/week publication cannot increment absence twice. The store lease and run state prevent a later refresh from proceeding until count-and-digest-verified lifecycle reconciliation completes.

Publication is one `TransactWriteItems` request containing five actions for the three-store system:

- update the candidate store's `STORE#<store> / PUBLICATION` only when its version and previous generation equal the values observed by the publisher;
- condition-check each of the other two store pointers at the exact version and generation used to build the target Publication Snapshot;
- condition-check `SNAPSHOT#<snapshotId> / META` is complete, covers the exact resulting three pointer tuples, has the expected checksum/document count, and is not cleanup-eligible; and
- update `GEN#<store>#<generation> / META` only when its state is `complete`, its expected revision matches, and all product/browse/search validation digests are present.

The transaction advances the pointer/version, durably records `previousGenerationId`, pins the other two store versions, proves the exact snapshot search projection is ready, and changes the generation state to `published`. The generation metadata already binds the expected target search-snapshot identity and digest. DynamoDB does not allow a separate condition check and update against the same item in one transaction, so each updated item carries its own condition expression.

The pointer update is the public visibility linearization point. Refresh-run and predecessor-retention bookkeeping follows idempotently. If execution stops after the transaction, recovery sees that the pointer already selects the generation, verifies its version/digest, and finishes bookkeeping without republishing.

## Read consistency and Publication Snapshots

The API reads the three store publication pointers with one `TransactGetItems` call, giving the Publication Snapshot one atomic view across stores. Product-detail, browse, sitemap, and Search Projection cold-load reads set `ConsistentRead: true`. All data is queried from base tables, where DynamoDB supports strong consistency.

A Publication Snapshot contains the three `(store, pointer version, generation ID)` tuples. Every browse or search request loads one snapshot. A cursor created under another snapshot is stale and is rejected rather than mixing generations.

## Browse cursor

The opaque, versioned cursor is HMAC-signed with a dedicated secret and is capped at 8 KiB. It contains:

- the Publication Snapshot;
- a fingerprint of normalized filters, ordering, and page size;
- the deterministic query-plan identity; and
- the last **consumed** sort key for every queried partition.

Plan partition keys are derived from the signed query fingerprint and need not be repeated in full. Recording consumed rather than merely fetched positions lets a subsequent request safely re-read buffered candidates without omissions. When duplicate product IDs are merged from several region partitions, all contributing positions advance atomically in the cursor. The 24-partition cap bounds cursor size and fan-out. Invalid signatures, altered queries, unsupported versions, and changed snapshots return an explicit stale/invalid-cursor result.

## Retention and deletion

TTL uses an optional numeric `expiresAt` attribute containing Unix epoch seconds on Catalog and Refresh, but only for independently expirable records:

- an inactive lifecycle item becomes TTL-eligible 30 days after inactivation;
- terminal workflow artifacts may receive `expiresAt` only after the run is terminal; and
- active publication pointers, active Catalog Generations, and Product Translations never receive TTL.

TTL never determines public visibility or Lifecycle Episode identity. Reads interpret explicit state and Publication Snapshot membership; expired records can remain stored and readable until DynamoDB's asynchronous deletion occurs.

Superseded generation deletion is not delegated to TTL because TTL does not cascade and stamping thousands of existing items would require thousands of update writes. After #44's retention deadline, a cleanup worker:

1. uses a transaction to verify no pointer selects the generation and irreversibly transition its metadata from retained to `cleanup-eligible`;
2. reads the Browse Projection manifest to enumerate every derived partition;
3. queries and deletes generation and browse items in bounded batches;
4. retries all unprocessed deletes before recording progress; and
5. marks cleanup complete only after strongly verifying that the known item collections are empty.

Every pointer-changing transaction rejects a target generation in `cleanup-eligible` or `cleanup-complete` state, making cleanup eligibility irrevocable and removing the read/delete race. Cleanup is resumable from an exact collection/continuation cursor.

Search snapshots have independent cleanup state because one snapshot projection covers three generations. A snapshot becomes cleanup-eligible only after #44 proves that no current Publication Snapshot, rollback-eligible predecessor, or candidate/complete generation references its identity. Its worker then deletes the snapshot metadata, manifest, and chunks in bounded resumable batches. A concurrent publisher condition-checks snapshot state and either commits before cleanup eligibility or fails cleanly and rebuilds against the new state.

## Access-pattern proof

| Required operation | DynamoDB operation | Bound / correctness rule |
| --- | --- | --- |
| Start/resume weekly run | `GetItem` + conditional `PutItem` on run head | one deterministic item |
| Transition/restart run | conditional `UpdateItem` | expected state + revision |
| Save/read manifest | conditional `PutItem`; prefix `Query` | 350 KiB segments; digest reconciliation |
| List/acquire chunks | run-prefix `Query`; conditional `UpdateItem` | deterministic bounded chunk count |
| Store lease | conditional `UpdateItem` | exact item; owner + fence + expiry |
| Save generation product | conditional `PutItem` | exact immutable key and digest |
| Verify generation | strong generation `Query` plus manifests | complete ID/count/digest coverage |
| Reconcile lifecycle | generation-prefix `Query`; conditional `UpdateItem` / `PutItem` | immutable delta count and digest; episode/revision/observation fencing |
| Reuse translation | exact `GetItem`; conditional `PutItem` | one source-identity item |
| Recover translation misses | generation-prefix `Query` | one bounded recovery pass |
| Read publication snapshot | `TransactGetItems` | exactly three pointer keys in one atomic view |
| Product detail | strong `BatchGetItem` | at most three generation-product keys; retry `UnprocessedKeys`; match by key, not response order |
| Browse | strong `Query` on 1–24 browse partitions | 400 candidates; 20 results; merge cursor |
| Free-text search | strong manifest/chunk reads on cold load | checksum verified; warm reads in memory |
| Sitemap | strong product-prefix `Query` per active generation | three generation partitions |
| Publish generation | five actions in one transaction | target update + two peer-pointer checks + snapshot check + generation update |
| Delete old generation | bounded `Query` + batch deletes | irrevocably ineligible first; resumable |
| Delete old search snapshot | bounded `Query` + batch deletes | no current/rollback reference; resumable |

There is no production request-path `Scan`. Offline diagnostics may scan only with explicit operator intent and may never be used to satisfy the public API contract.

## Failure behavior

- A missing/corrupt Browse Projection blocks publication; it is not repaired in place after publication.
- A missing/corrupt Search Projection blocks publication. At request time, a load failure returns a controlled free-text-search error while direct browse remains available.
- A conditional immutable-write conflict with unequal content blocks the run.
- Exhausted candidate budget returns the matches found, a cursor when work remains, and `exhausted: false`; the client continues an empty non-exhausted page and never reports a final zero-match state early.
- A pointer race rejects the losing publisher. It must reload the pointer and cannot overwrite a newer/same-week generation.
- A lifecycle reconciliation mismatch is an integrity failure: it freezes the next refresh and records an alert rather than force-writing canonical state.
- A stale cursor is rejected explicitly; it never resumes against a new Publication Snapshot.
- A cleanup interruption resumes from recorded progress. Irrevocable `cleanup-eligible` state prevents any pointer from reselecting the generation or search snapshot while batches run.

## Rejected alternatives

### One mixed-purpose table

Rejected because public catalog reads, leased workflow mutations, short-lived telemetry, and permanent translations have unrelated lifecycle and IAM boundaries. Combining them saves Terraform resources but increases coupling and the blast radius of key, TTL, or capacity mistakes.

### Two tables with translations in Refresh

Rejected because Product Translations are reusable domain assets with a non-TTL lifecycle, while refresh artifacts are operational and aggressively retained.

### GSI/LSI browse model

Rejected for the initial model. GSIs add write amplification, are eventually consistent, and can apply back-pressure to base-table writes. LSIs are fixed at table creation and couple alternative ordering to one item collection. Neither eliminates the need to handle multi-select filters and deterministic cross-partition pagination. A future measured access pattern may justify a superseding decision; speculative indexes are prohibited.

### Full-text indexes in DynamoDB

Rejected by the approved search research and prototype. No token-per-product items, text GSIs, regex scans, or filter-driven table scans are allowed.

### TTL for whole-generation cleanup

Rejected because TTL is per item and asynchronous. It would require rewriting every immutable generation item to add expiry and still could not define visibility.

### Lifecycle state derived only from generations

Rejected because first-absence carry-forward, reactivation, replay-safe counters, and the 30-day inactive retention window require a compact canonical lifecycle owner. Deriving state by scanning or folding generations would make publication recovery unbounded and leave no stable fence for delayed writes.

## Decisions deliberately deferred

- #44 owns cross-store search/browse publication coordination, predecessor retention duration, and rollback protocol.
- #39 owns Terraform module boundaries, provisioned versus on-demand capacity, budgets, alarms, backups, deletion protection, and the final RM1 cost worksheet.
- Production implementation must benchmark Browse Projection item count/bytes, candidate-read amplification, cursor size, strong-read capacity, cleanup duration, and the complete API's 205 MiB peak-RSS gate before public cutover.

## Verification required before implementation acceptance

1. Generate a representative 5,000-product three-store Catalog Generation and prove every item—including Browse Projection entries—stays below 400 KB; store search chunks as Binary attributes capped at 350 KiB decoded.
2. Measure total authoritative, browse, and search bytes plus writes per weekly refresh.
3. Exercise every filter/order combination, including the 24-partition fallback and 400-candidate short-page contract.
4. Prove no duplicates or omissions across cursors, including products present in multiple selected region partitions, and reject changed-snapshot cursors.
5. Demonstrate conditional conflict detection for every immutable entity.
6. Interrupt publication immediately before and after the transaction and prove idempotent recovery.
7. Race rollback/publication against generation and search-snapshot cleanup eligibility, then interrupt cleanup after each batch and prove it resumes without any artifact becoming both selectable and deletable.
8. Record consumed capacity for generation build, publication, cold search load, browse, detail, sitemap, and cleanup.
