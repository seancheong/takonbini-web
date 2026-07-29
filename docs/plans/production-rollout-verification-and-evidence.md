# Production rollout, verification, and evidence gates

**Status:** Accepted plan  
**Decided:** 2026-07-29  
**Issue:** [#13 — Set production rollout, verification, and evidence gates](https://github.com/seancheong/takonbini-web/issues/13)

## Outcome

Takonbini will restore catalog reliability before restructuring or redesigning the web application. Every production change is additive or independently reversible, every phase has explicit entry and exit evidence, and no public case-study claim is made before its measurement window closes.

This is a cross-repository implementation plan for the private API/scraper repository and public web repository. It does not implement, deploy, schedule, migrate, or publish the destination.

## Governing decisions

- Scraper execution: Google Cloud Run Jobs in `us-central1`, subject to the strict `$0` gates in [issue #14](https://github.com/seancheong/takonbini-web/issues/14); Apify Free is the fallback.
- Ingestion: resumable per-store weekly Store Refreshes, immutable manifests, deterministic 100-product chunks, MongoDB workflow state, and atomic complete-generation publication from [issue #10](https://github.com/seancheong/takonbini-web/issues/10).
- Web structure: one deep products module with browser, contract, and server interfaces, migrated in the order decided in [issue #9](https://github.com/seancheong/takonbini-web/issues/9).
- UX: the validated Editorial catalog system from [issue #12](https://github.com/seancheong/takonbini-web/issues/12), including bounded infinite scroll and preserved detail return.
- Cutover: generation-based catalog reads run beside the legacy `products` read model until a reversible production switch.

## Non-negotiable rules

1. Security remediation precedes production infrastructure changes and has no waiver.
2. Routine jobs remain unattended after one-time identity bootstrap.
3. Database changes are additive until the 35-day rollback window closes.
4. Scraper publication and web releases never occur in the same production change window.
5. No phase advances with a failed gate, unresolved alert, unavailable rollback, or missing evidence.
6. Failed Store Refreshes do not extend catalog freshness.
7. Estimates are labelled as estimates; production claims require production measurements.

## Release train

```text
0. Security and baselines
   -> 1. Scraper module and additive data model
   -> 2. Dormant Cloud Run deployment and strict-$0 benchmark
   -> 3. Shadow run and recovery drills
   -> 4. Store publication canaries
   -> 5. Reversible API generation-read cutover
   -> 6. Two scheduled reliability cycles
   -> 7A. TanStack compatibility release
   -> 7B. Products-module/contract release
   -> 7C. Editorial UX release
   -> 8. Thirty-day cost window and evidence package
```

The scraper, API read model, and web each have separate rollback points. Advancing one does not consume the rollback path of another.

## Phase 0 — Security and baselines

### Implementation increments

Create small reviewable commits in this order:

1. **Stop exporting database credentials.** Remove the deployment step that writes MongoDB connection material to a file and uploads it as a GitHub artifact. Delete retained copies under the repository's artifact retention controls.
2. **Rotate exposed credentials.** Rotate the affected MongoDB user/password and invalidate the old values. Verify no secret value appears in workflow logs, artifacts, repository history, or test fixtures.
3. **Bootstrap GitHub OIDC for AWS.** Create the GitHub OIDC provider and a least-privilege deployment role restricted by audience plus repository/environment or branch subject. Change `configure-aws-credentials` from stored keys to `role-to-assume`.
4. **Remove long-lived AWS secrets.** Execute one successful deployment through OIDC, then delete the repository's AWS access-key secrets. Retain a documented break-glass process outside GitHub rather than a reusable CI key.
5. **Verify production identities.** Record least-privilege access for AWS deployment, Cloud Run runtime/deployer, MongoDB scraper/API users, OpenAI access, Artifact Registry, Scheduler, Build, Logging, and Secret Manager.
6. **Capture baselines.** Record current API contract responses, catalog counts, scraper timings/counts, web routes, bundle sizes, Lighthouse results, Core Web Vitals where available, error/latency metrics, CI duration, and current monthly usage.

### Exit evidence

- Redacted OIDC role trust and permission-policy review.
- Successful unattended deployment run using temporary credentials.
- Evidence that long-lived keys and credential artifacts are absent/revoked.
- Dated baseline report with commit IDs and measurement conditions.
- Documented owners and rollback commands for API, scraper, database pointer, and web deployment.

## Phase 1 — Scraper module and additive data model

All new workflow data is written alongside the legacy `products` collection. Production reads remain unchanged.

### API/scraper commit sequence

1. **Characterize retailer adapters.** Add controlled fixtures and characterization tests for Lawson, FamilyMart, and Seven-Eleven discovery, detail extraction, identity, category/region mapping, and malformed pages without changing selectors.
2. **Introduce Store Refresh contracts.** Add run, manifest, chunk, generation, publication, translation, outcome, and failure types plus the small `StoreRefresh.execute` interface and in-memory test adapters.
3. **Extract retailer adapters.** Move current store logic behind discovery/detail interfaces while preserving output and smoke coverage.
4. **Add workflow persistence.** Add versioned MongoDB repositories and indexes for refreshes, manifests, chunks, generations, publication pointers, and translation cache. Migrations are additive and idempotent.
5. **Add deterministic identity and safety gates.** Implement canonical manifests, hashes, 100-product chunk IDs, deduplication, 70% previous-count gate, 5% invalid/duplicate gate, and structured traversal failures test-first.
6. **Add leases and resumability.** Implement deterministic store/week run IDs, compare-and-set state transitions, expiring leases, duplicate-delivery handling, blocked-run supersession, and completed-chunk skipping.
7. **Add bounded processing.** Enforce one chunk per store, two pages per chunk, three product attempts with jittered backoff, and two additional task attempts against the frozen manifest.
8. **Separate translations.** Add source-content identity, indefinite successful translation cache, Japanese fallback, non-blocking failure state, and one bounded post-publication recovery pass.
9. **Add candidate generations.** Write generation-scoped products invisibly and verify count, identity, digest, and completeness invariants.
10. **Add atomic Store Publication.** Publish with one versioned per-store pointer update, retain the previous generation, and enforce 8/15/28-day freshness behavior.
11. **Add legacy/generation API reads.** Introduce a validated `legacy | generation` read-mode setting while keeping the response contract compatible with the current web release.
12. **Add telemetry and retention.** Emit bounded structured summaries, alerts, cost/resource measures, and 90/35-day TTL behavior without logging secrets or full product content.

### Required test surface

- Pure identity, partition, threshold, freshness, and state-transition tests.
- Module-interface tests using in-memory adapters; tests assert observable outcomes, not implementation state.
- MongoDB repository/index integration tests in an isolated database.
- Controlled retailer HTML/JSON fixture tests and rate-limited live smoke tests.
- Translation cache hit/miss/version/failure tests with a deterministic adapter.
- Contract tests proving legacy and generation reads produce compatible public products.
- Failure tests for duplicate delivery, expired lease, mid-chunk termination, permanent item failure, partial generation, publication race, and translation outage.

### Exit evidence

- All tests, lint, type checking, builds, and secret scanning pass in CI.
- Existing selectors and public API behavior are characterized before refactoring.
- No production reader can see candidate generations.
- A complete rollback restores the legacy reader without deleting new collections.

## Phase 2 — Dormant Cloud Run deployment and cost benchmark

Deploy build/runtime infrastructure with Scheduler disabled and publication disabled.

### Increments

1. Build a pinned, Chromium-only, multi-stage scraper image and record compressed Artifact Registry storage.
2. Connect the private repository through the approved build identity; retain one deployable image and enable cleanup.
3. Configure one Cloud Run Job at `1 vCPU / 2 GiB`, three tasks, parallelism three, task retry two, bounded timeout, and Secret Manager references.
4. Configure least-privilege runtime access and prove MongoDB Atlas connectivity without paid static egress or broader network access.
5. Add Scheduler configuration in a disabled state and prove duplicate manual invocations map to one Store Refresh.
6. Run one representative three-store benchmark with publication disabled.

### Strict `$0` exit gate

Projected monthly normal use plus failure reserve must remain below:

- 120,000 vCPU-seconds;
- 225,000 GiB-seconds;
- 0.5 GiB-month retained Artifact Registry storage;
- 0.5 GiB external transfer;
- 25 GiB logs;
- 50% of every other relevant free allowance.

Record wall time, allocated compute, peak RSS, image size, transfer, logging, build time, per-store/chunk counts, retries, translation calls, and MongoDB operations. If a hard gate fails, stop and benchmark the unchanged module on Apify. Do not enable scheduling by accepting an overage.

## Phase 3 — Shadow run and recovery drills

Run against production-shaped inputs with generation publication disabled and the API still reading legacy products.

### Required shadow evidence

- One complete three-store run.
- Candidate counts reconciled to each frozen manifest.
- Legacy-versus-generation contract diff reviewed, with expected differences documented.
- Product samples verified across each store, category, region, language state, image behavior, price edge, and new/non-new state.
- Translation reuse/request/failure counts recorded.
- No unexpected mutation of legacy products or their TTL.

### Required recovery drills

1. Deliver the same schedule event twice; observe one run and no duplicate publication.
2. Terminate during a chunk; observe lease expiry and resume without repeating completed chunks.
3. Produce a 60% discovery result; observe automatic block and unchanged freshness.
4. Exhaust one product and chunk's retries; observe blocked store with other stores unaffected.
5. Fail OpenAI; observe Japanese publication eligibility and bounded translation recovery.
6. Race two publication attempts; observe one pointer winner and an idempotent loser.
7. Activate a bad test generation, then restore the previous pointer and verify catalog recovery.
8. Advance a controlled clock through 8, 15, and 28 days; observe warning, escalation, and catalog expiry.

All drill identifiers, timings, alerts, and outcomes are retained as evidence. Synthetic failures are clearly labelled and never mixed with production catalog claims.

## Phase 4 — Store publication canaries

Enable publication one store at a time, ordered by current workload size and complexity:

1. Lawson.
2. FamilyMart.
3. Seven-Eleven.

For each canary:

- keep the API on legacy reads;
- perform one complete Store Refresh;
- compare manifest, candidate generation, and public-contract projections;
- inspect a stratified product sample;
- verify alerts, freshness timestamps, translation fallback, retention, and cost measures;
- wait through a 24-hour observation window with synthetic checks;
- do not enable the next store until every alert is resolved.

Rollback disables that store's publication, restores its prior pointer, and preserves both generations for diagnosis.

## Phase 5 — Reversible API cutover

### Preconditions

- All three store canaries passed.
- Legacy and generation response contracts remain compatible.
- Previous Lambda version and legacy read mode are verified rollback targets.
- Legacy data has at least 35 days of retained availability from cutover.

### Cutover

1. Deploy generation-read support while the setting remains `legacy`.
2. Run production synthetic checks against an authenticated/non-public generation-read probe.
3. Switch the production setting to `generation` without changing the web deployment.
4. Verify list, search, filter, pagination, detail, sitemap, languages, empty catalog, expired store, and upstream failure behavior.
5. Observe for 24 hours before proceeding.

### Immediate rollback

Switch back to `legacy` and restore the previous Lambda version when any of these occurs:

- public contract or schema mismatch;
- mixed, missing, or incomplete generation visibility;
- a primary catalog/detail journey fails;
- secret exposure or unauthorized access;
- sustained API 5xx rate above 1% for five minutes;
- p95 latency above twice the verified baseline for five minutes.

Do not delete candidate data during rollback. Diagnose against retained run/generation identifiers, then repeat the gate.

## Phase 6 — Reliability observation

Enable the weekly schedule only after the API cutover's 24-hour window passes. The scraper may be described as an automated weekly refresh only after one scheduled cycle succeeds. It may be described as resilient only after the recovery drills and **two consecutive successful scheduled weekly cycles across all three stores**.

During both cycles verify:

- schedule delivery and deterministic run identity;
- per-store completion and atomic publication;
- no overlapping runs or manual intervention;
- counts remain within discovery gates;
- freshness derives only from successful Store Publication;
- translation cache reuse increases or remains explainable;
- resource and storage projections remain below strict `$0` gates;
- alerts reach their documented destination and contain actionable run identifiers.

## Phase 7 — Web release train

The API continues serving a backward-compatible contract throughout all three releases.

### 7A — TanStack compatibility

1. Add characterization tests for current route/search/loader/SSR/head behavior.
2. Align the selected TanStack package snapshot and regenerate the route tree.
3. Resolve only compatibility changes; do not move modules or alter UX.
4. Pass CI, preview verification, production checks, and the 24-hour observation window.

Rollback restores the previous lockfile and Vercel deployment.

### 7B — Products-module and contract migration

1. Mechanically move product files under `features/products` with no behavior change.
2. Introduce shared runtime-validated `ActiveCatalogProduct` contracts.
3. Deepen browser queries and catalog state behind the browser interface.
4. Introduce the server-only `ProductCatalogSource` port with HTTP and in-memory adapters.
5. Migrate API proxy routes and sitemap one route at a time.
6. Remove old paths only after dependency search and characterization pass.
7. Pass CI, preview verification, production checks, and the 24-hour observation window.

Rollback restores the previous Vercel deployment; the API remains compatible with both versions.

### 7C — Editorial UX

1. Add the approved information hierarchy, warm light/dark tokens, typography, cards, and catalog states.
2. Add sticky debounced search, URL synchronization, result announcements, staged mobile filters, applied-filter chips, and clear-all.
3. Add bounded progressive infinite scroll with progress and an explicit end marker.
4. Add shareable detail routes, exact loaded-count/scroll restoration, and resilient not-found/error states.
5. Add 200 ms shared-image view transitions with instant reduced-motion behavior.
6. Remove prototype-only fixtures and controls from production entrypoints.
7. Pass every UX gate below, preview verification, production checks, and the 24-hour observation window.

Rollback restores the prior Vercel deployment without changing scraper or API publication state.

## Hard web/UX release gates

### CI

- Formatting/lint, TypeScript, unit/integration tests, production build, and dependency/secret scanning pass.
- End-to-end tests cover search, URL synchronization, filter draft/apply/discard, chip removal, infinite loading/end state, detail routing, back restoration, empty/no-match/error recovery, theme, language, SSR hydration, reduced motion, and sitemap behavior.

### Accessibility

- Zero serious or critical automated accessibility violations.
- Keyboard-only completion of catalog search/filter/load/detail/back flows.
- VoiceOver smoke coverage of the same primary loop, announcements, drawer focus management, and loading transitions.
- Focus remains visible and logical; content appended by infinite scroll does not steal focus.
- Light and dark themes pass contrast checks in English, Japanese, and Chinese.

Passing these checks supports “tested against WCAG 2.2 AA criteria,” not a claim of formal certification.

### Responsive and visual

- Mobile, tablet, and desktop widths cover all three languages and both themes.
- Product images, store identity, price/region/category labels, long translations, missing translations, and missing images remain legible and stable.
- Screenshot diffs are reviewed against the accepted Editorial prototype, with intentional differences documented.

### Performance, SSR, and SEO

- Production-like mobile measurement targets LCP ≤2.5 s, INP ≤200 ms, and CLS ≤0.1.
- Lighthouse performance, accessibility, best-practices, and SEO scores are each at least 90 under recorded conditions.
- No unexplained regression above 10% from the recorded baseline for bundle size or route response time.
- HTML contains meaningful catalog/detail metadata before hydration; canonical URLs, locale behavior, robots, and sitemap are verified.

## Production observation and rollback policy

Each production release receives a 24-hour hold before the next release. Automated probes exercise list, search, filters, pagination/infinite continuation, detail, images, sitemap, and API health.

Rollback immediately on:

- contract/schema mismatch;
- mixed or incomplete catalog generations;
- exposed secret or authorization regression;
- broken primary journey;
- sustained 5xx rate above 1% for five minutes;
- p95 API latency above twice baseline for five minutes.

Pause and investigate before advancing on accessibility, performance, visual, translation, freshness, cost, or non-primary functional regressions. If a hard gate cannot be restored within the observation window, roll back rather than waive it.

## Verification and evidence matrix

| Area | Required evidence | Claim unlocked |
| --- | --- | --- |
| Security | Redacted OIDC trust/policy, temporary-credential deploy run, rotation/revocation record, artifact/log scan | “Automated deployment uses short-lived credentials” |
| Scraper correctness | Interface/integration test reports, fixture provenance, manifest/chunk reconciliation | “Deterministic and idempotent processing” |
| Recovery | Drill run IDs, timelines, alerts, before/after pointers | “Resilient to duplicate delivery and interrupted chunks” |
| Publication | Candidate/published counts, atomic-pointer proof, legacy/generation diff | “Publishes complete per-store generations” |
| Automation | Two consecutive scheduled three-store cycles with no manual intervention | “Automated weekly refresh” |
| Freshness | Controlled 8/15/28-day results and production publication timestamps | “Removes observations after the defined freshness window” |
| Translation | Cache hit/miss/failure/recovery counts and Japanese fallback examples | “Reuses unchanged translations without blocking publication” |
| Cost | Full 30-day invoices/usage dashboards and allowance calculations | “`$0` infrastructure cost during the measured period” |
| Web architecture | Characterization results, commit/PR sequence, interface tests, dependency scan | “Restructured behind a deep products module” |
| UX | Accepted prototype comparison, E2E report, responsive/theme/language screenshots | “Implemented the validated Editorial catalog experience” |
| Accessibility | Automated report plus keyboard and VoiceOver checklist | “Tested against targeted WCAG 2.2 AA criteria” |
| Performance | Dated Lighthouse/Core Web Vitals reports with device/network/sample conditions | “Met measured performance targets under stated conditions” |
| Rollback | API read-mode, publication-pointer, Cloud Run schedule, Lambda, and Vercel rollback drills | “Independently reversible releases” |

## Thirty-day cost and claims gate

Start the measurement window only after the weekly schedule and final production configuration are stable. Wait one complete 30-day billing period.

The bounded `$0` claim requires:

- a `$0.00` recurring infrastructure charge during that period;
- measured use below 50% of every relevant Cloud Run, Scheduler, Cloud Build, Artifact Registry, Logging, storage, and transfer allowance;
- disclosure of OpenAI, MongoDB, and any electricity/owned-runner costs separately;
- the measurement dates, region, configuration, workload counts, failure reserve, and source dashboards.

Do not claim “free forever.” If the period incurs a charge or breaches a 50% gate, record the result and follow the Cloud Run-to-Apify fallback decision rather than reframing the metric.

## Publication-safe claims

Use only these bounded formulations after their evidence gates pass:

- “Automated weekly refresh” after two scheduled cycles.
- “Resilient” only with linked recovery-drill evidence.
- “Tested against targeted accessibility criteria,” not “WCAG certified.”
- “Met measured Core Web Vitals targets” with conditions, not an unconditional performance claim.
- “Observed retailer listings,” not real-time inventory or store-level availability.
- “Ran at `$0` infrastructure cost during the measured 30-day period,” not permanent free operation.

Evidence may include redacted run summaries, test reports, cost dashboards, deployment links, architecture diagrams, screenshots, and short recordings. Exclude credentials, private database identifiers, full retailer datasets, customer/user data, unpublished private-repository content, and retailer product assets without clear publication rights.

## Completion definition

The destination is implementation-complete only when:

1. every phase has its required linked evidence;
2. the catalog has completed two unattended weekly cycles;
3. scraper, API, publication pointer, database, and web rollback drills pass;
4. all web/UX hard gates pass in production-like conditions;
5. no security, correctness, freshness, cost, or accessibility alert is unresolved;
6. the 30-day cost window has closed before any `$0` claim;
7. the evidence package distinguishes plans, estimates, synthetic drills, and measured production outcomes.

Until then, the case-study journal may describe the work as planned or in progress, never as shipped or proven.
