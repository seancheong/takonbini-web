# Weekly scraper workflow and publication design

**Status:** Accepted design  
**Decided:** 2026-07-29  
**Issue:** [#10 — Choose the weekly scraper workflow and publication design](https://github.com/seancheong/takonbini-web/issues/10)  
**Execution decision:** [Cloud Run Jobs primary; Apify Free fallback](https://github.com/seancheong/takonbini-web/issues/14)

## Decision

Run one deterministic, resumable Store Refresh per store and ISO week. Each refresh discovers an immutable manifest, processes deterministic 100-product chunks, builds a candidate Catalog Generation, and atomically publishes that generation only after every chunk succeeds. A failure leaves the previous generation visible until its 28-day freshness deadline.

Google Cloud Run Jobs is the first execution adapter. The workflow itself is owned by one deep `StoreRefresh` module and persists its state in MongoDB, so local execution and a future host can use the same behavior without reimplementing ordering or recovery rules.

This document resolves architecture. It does not deploy or implement the workflow, prove that it fits the strict `$0` envelope, or authorize scraping a retailer whose terms do not permit the access pattern.

## Workflow topology

One weekly Cloud Scheduler trigger starts one Cloud Run Job configured with three tasks and parallelism three. Task index maps deterministically to Lawson, FamilyMart, or Seven-Eleven. Each task calls the same module interface and processes only one chunk at a time for its store.

```text
Weekly trigger
  -> Cloud Run Job (3 tasks, parallelism 3)
     -> StoreRefresh.execute(Lawson, ISO week)
     -> StoreRefresh.execute(FamilyMart, ISO week)
     -> StoreRefresh.execute(Seven-Eleven, ISO week)

For each store:
  acquire lease
  -> discover or resume
  -> validate and freeze manifest
  -> process incomplete chunks sequentially
  -> verify complete generation
  -> atomically publish store pointer
  -> run one bounded translation-recovery pass
  -> release lease and emit summary
```

The scheduler provides at-least-once delivery. Duplicate delivery is safe because the Store Refresh identity, manifest, chunk identities, writes, and publication operation are idempotent.

## Deep module and seams

The external interface is deliberately small:

```ts
type StoreRefreshRequest = {
  store: Store
  scheduledWeek: string
}

type StoreRefreshOutcome = {
  runId: string
  store: Store
  status: "published" | "blocked" | "already-published" | "already-running"
  publicationId?: string
}

interface StoreRefresh {
  execute(request: StoreRefreshRequest): Promise<StoreRefreshOutcome>
}
```

Callers do not coordinate discovery, chunks, retries, or publication. Repeating `execute` resumes the same deterministic run and skips completed work.

The implementation owns internal seams for:

- a workflow-state repository, with MongoDB and in-memory test adapters;
- one source scraper adapter per retailer, plus controlled test adapters;
- a catalog-generation repository, with MongoDB and in-memory test adapters;
- a translation adapter, with OpenAI and deterministic test adapters;
- clock, lease-owner, telemetry, and content-digest providers.

Cloud Run and the local CLI are thin execution adapters. They map environment input to `StoreRefreshRequest`, invoke the module once, and translate the outcome into process status. They contain no workflow ordering or publication logic.

## Identity and immutability

### Store Refresh

`runId = sha256(schemaVersion + store + ISO-week)`.

- One run exists for each store and scheduled ISO week.
- Repeated scheduler delivery resolves to the same run.
- A lease with owner and expiry prevents concurrent execution for the same store.
- A newer week may supersede an older `blocked` run, but cannot overlap a `discovering`, `processing`, or `publishing` run.
- `published` runs are immutable and subsequent calls return `already-published`.

### Discovery Manifest

Discovery emits source identity, canonical URL, store, region/category hints, and listing metadata. Entries are canonicalized, deduplicated by stable store-specific source identity, sorted by that identity, and then hashed.

`manifestId = sha256(schemaVersion + store + canonical entries)`.

Once validation succeeds, the manifest and digest are immutable. Retry and resume always use the frozen manifest; they never rediscover within the same run.

### Processing Chunk

The manifest is partitioned into contiguous groups of 100 entries.

`chunkId = sha256(manifestId + chunkIndex + ordered source identities)`.

The chunk records its input entries, attempt history, item outcomes, aggregate counts, and terminal state. Reprocessing a completed chunk is a no-op. Candidate product writes use `{generationId, store, sourceProductId}` as their idempotency key.

Chunk size is configuration with an initial maximum of 100. Benchmark evidence may reduce it automatically; increasing it requires an explicit reviewed configuration change.

## State model

A Store Refresh progresses through:

```text
scheduled -> discovering -> ready -> processing -> ready-to-publish
          -> blocked                    -> publishing -> published
          -> superseded
```

- `blocked` means automatic retries were exhausted or an invariant failed.
- `superseded` means a newer scheduled week replaced an older blocked run.
- Only `ready-to-publish` may enter `publishing`.
- Publication failure returns to `ready-to-publish`; it never marks a partial generation active.
- A lease expiry permits safe resume because each transition uses a compare-and-set against the expected state and version.

## Discovery safety

A manifest is automatically blocked when any of these conditions holds:

1. no products were discovered;
2. any discovery traversal ended with an unhandled failure;
3. invalid or duplicate entries exceed 5% of raw entries;
4. the valid count is below 70% of that store's last successfully published manifest.

The discovery adapter must return structured traversal outcomes instead of swallowing branch errors. A manual approval records approver, timestamp, reason, observed counts, and the exact manifest digest. Zero-result manifests and manifests with incomplete traversal must be rediscovered rather than approved for publication.

## Processing and retry policy

- Up to three stores execute concurrently.
- Each store processes one chunk at a time.
- Each chunk uses at most two concurrent Playwright pages.
- A retailer product request receives three total attempts with exponential backoff and jitter.
- A chunk failure causes the Cloud Run task to fail; Cloud Run may make two additional task attempts.
- A retried task reacquires the lease, loads the same run, and resumes at the first incomplete chunk.
- After retries are exhausted, the run becomes `blocked`, emits an immediate alert, and preserves the prior publication.

Translation failure is not a product-processing failure. Product source extraction or validation failure is.

## Translation cache

Product Translation is separate from Active Catalog Product and has no TTL. Its identity includes the normalized Japanese title and description digest, translation target languages, prompt/schema version, and model family. A cache hit is reusable across refreshes and catalog absence; a source-content or translation-contract change creates a new cache entry.

Chunk processing performs a cache lookup and attempts translation on a miss. If translation still fails, the verified Japanese product remains eligible for publication with an explicit `pending` or `failed` translation status. The application falls back to Japanese rather than representing machine output as complete.

After Store Publication, one bounded recovery pass retries that generation's unresolved translations. It does not change publication success or launch another schedule. Remaining misses retry during the next weekly refresh.

## Catalog generation and publication

Processed products are written to a candidate generation that is invisible to catalog reads. The generation records its manifest digest, source run, product count, completion counts, and validation result.

Publication requires all of the following:

- every manifest chunk is terminal and successful;
- every manifest entry has exactly one valid candidate outcome;
- aggregate chunk counts equal the manifest's valid-entry count;
- no duplicate candidate identity exists;
- generation and run digests still match the frozen manifest;
- the store publication pointer has not advanced to a newer scheduled week.

One compare-and-set update to the per-store publication pointer activates the generation and records `publishedAt` and `freshUntil`. Stores publish independently; Lawson success does not wait for FamilyMart or Seven-Eleven.

Catalog reads join each product to its store's active publication pointer and ignore a pointer whose `freshUntil` has passed. Failed refreshes never update `publishedAt`, `freshUntil`, product observations, or TTL fields.

## Freshness and retention

- Warn when a store has no successful publication for 8 days.
- Escalate at 15 days.
- At 28 days, exclude the store's generation from the Active Catalog.
- Keep compact terminal run summaries for 90 days.
- Keep manifests, chunk details, and superseded generations for 35 days.
- Keep successful Product Translations without TTL, with storage growth monitored.

The public application may show the last successful observation time. It must not expose internal error messages or claim real-time inventory.

## MongoDB persistence model

Use separate collections with schema versions and indexes defined alongside the implementation:

| Collection | Purpose | Key/index invariant | Retention |
| --- | --- | --- | --- |
| `store_refreshes` | State, lease, counts, timings, failure summary | Unique `runId`; unique `{store, scheduledWeek}` | Terminal summaries 90 days |
| `discovery_manifests` | Immutable headers and safety evidence | Unique `manifestId`; digest cannot change | 35 days |
| `processing_chunks` | Frozen inputs, attempts, item outcomes | Unique `chunkId`; `{runId, chunkIndex}` unique | 35 days |
| `catalog_generations` | Candidate and superseded store products | Unique `{generationId, store, sourceProductId}` | 35 days after supersession/expiry |
| `store_publications` | One active generation pointer per store | Unique `store`; compare-and-set version | Pointer retained |
| `product_translations` | Reusable localized content | Unique source-content and translation-contract digest | No TTL |

Do not reuse the current `products.expiresAt` heartbeat as the publication mechanism. It mutates visibility while a run is incomplete and couples translation lifetime to catalog freshness.

## Observability contract

Every log and metric carries `runId`, `store`, `scheduledWeek`, stage, and attempt. Never log credentials, full page bodies, or complete product descriptions.

The terminal run summary records:

- discovery raw, valid, duplicate, invalid, and previous-success counts;
- manifest digest and chunk count;
- chunks attempted, resumed, succeeded, and failed;
- products discovered, processed, failed, and staged;
- translations reused, requested, recovered, pending, and failed;
- database reads/writes and publication result;
- stage and total durations, retry counts, peak RSS, external transfer, image version, and log volume;
- previous and new publication identifiers and freshness timestamps.

Alert immediately on a blocked run, lease conflict that persists beyond retry, publication compare-and-set failure, or cost-gate breach. Freshness alerts are derived from the last successful Store Publication, not scheduler success.

## Strict `$0` gates

Before enabling the weekly schedule, a representative three-store run must satisfy issue #14's measured gates: 50% of the Cloud Run CPU and memory allowances, retained image at or below 0.5 GiB-month, external transfer below 0.5 GiB/month, logs below 25 GiB/month, and Atlas access without paid static egress or weakened security.

The first benchmark uses `1 vCPU / 2 GiB` per task. Increasing memory, page concurrency, chunk size, task parallelism, retained generations, or log detail requires recalculating the envelope. A hard gate failure sends the unchanged module to the Apify adapter; failure of Apify's conservative `$2.50` gate makes strict `$0` managed execution infeasible.

## Implementation and verification sequence

1. Characterize current store discovery, detail extraction, translation reuse, and MongoDB writes with controlled fixtures.
2. Define the domain records, indexes, and the `StoreRefresh` interface with in-memory adapters.
3. Move each retailer behind a discovery/detail adapter without changing selectors.
4. Implement manifest canonicalization, validation, identity, leases, and resumable chunk processing test-first.
5. Split Product Translation persistence from catalog generations and preserve Japanese fallback behavior.
6. Add candidate generations and atomic per-store publication; replace heartbeat reads only after characterization passes.
7. Add structured summaries, alerts, TTL indexes, and storage/cost gauges.
8. Add the local CLI adapter, then the Cloud Run task adapter and weekly schedule.
9. Run one representative unscheduled three-store benchmark and enforce every strict `$0` gate.
10. Perform failure drills: duplicate delivery, expired lease, one product failure, one chunk failure, translation outage, suspicious discovery, publication race, and 28-day expiry.
11. Enable scheduling only after all correctness, security, and cost evidence is recorded.

## Acceptance scenarios

- Repeating the same scheduled invocation produces one run and at most one publication.
- Killing a task midway resumes the same manifest and skips completed chunks.
- One permanently failed product blocks that store generation after bounded retries; other stores may publish.
- An OpenAI outage publishes verified Japanese source products and queues bounded recovery.
- A 60% discovery count never refreshes catalog freshness automatically.
- A complete new generation becomes visible through one pointer update; no mixed generation is observable.
- A store with no successful publication remains on its previous generation through day 27 and disappears at day 28.
- A product absent from the active catalog may reuse its prior translation when identical source content returns.
- Switching from Cloud Run to the local or Apify adapter does not change workflow-state or publication behavior.
