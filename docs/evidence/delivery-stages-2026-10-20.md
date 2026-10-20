# Remaining document and first-image delivery — 20 October 2026

Continuation of #86 and draft web PR #88 after the approved serving API memory rollout. Production is unchanged during this task. The existing 3.995-second / score-80 first catalog failure is retained. The agreed mobile harness catches the exact release symptom (any sample score <90, LCP >2.5 seconds or CLS >0.1); replaying its saved verdict returns exit 1.

## Ranked hypotheses and probe

Before measurement: (1) web startup/SSR adds delay beyond the API request, (2) retailer download or processing dominates image MISS, (3) mobile body transfer accounts for a material remainder. Temporary numeric-only Server-Timing headers measured catalog fetch/validation, Nitro handler time, and image admission/download/processing. No identifiers, payloads or secrets were exposed. A compiled SSR fixture with a 150 ms delay reports catalog 153.9 ms / handler 267.8 ms and contains actual product markup. Compiled image isolation still passes.

Probe revision **0aa9f0b39b53015a6c0fbab25466a289cbe51e22**, deployment **7200728630**, fresh unvisited preview. [All nine samples and pinned method](./delivery-stages-2026-10-20/diagnostic-mobile.json); [sanitized stage timings](./delivery-stages-2026-10-20/stage-timings.json). No application/image smoke primed the first navigation. The temporary source-level response-header call fails six existing unit tests that execute without a Start request context; the real compiled SSR fixture passes. This diagnostic revision is not release-ready. All probes were removed from the next candidate and the full suite passes there; test failures are not waived or hidden.

| Case | LCP runs (s) | Scores |
| --- | --- | --- |
| Catalog | **2.588**, 1.359, 1.257 | 94, 100, 100 |
| Heavy detail | 1.558, 1.160, 1.427 | 100, 100, 100 |
| Light detail | 1.278, 1.097, 1.097 | 100, 100, 100 |

CLS zero throughout; first catalog TBT 3.935 ms, others zero. Exit **1**, first catalog fails LCP. The catalog image is MISS/HIT/HIT; light image MISS/HIT/HIT; heavy detail reuses the HIT. This is not a controlled improvement from the preceding 3.995-second series: source, backend and platform state vary.

First catalog: final document headers **1,299.503 ms**, body complete **1,461.590 ms**, catalog source **116.8 ms**, handler **429.1 ms**. Later catalog source/handler fall to **90.6/143.5 ms**. Measured application handling does not explain the entire final-header wait. The outside-handler remainder includes network, scheduling, startup before hooks and delivery; these headers do not uniquely identify a platform cause or justify a speculative SSR rewrite.

First image: request at **1,380.636 ms**, final headers **763.051 ms after image request**, body complete at **2,568.315 ms**. Admission **0.1 ms**, retailer download **37.1 ms**, processing **180.8 ms**, handler **365.3 ms**. First image processing is material; slow retailer transfer is not dominant in this observed MISS. An edge MISS does not force a cold retailer origin. Remaining body transfer is approximately **424.6 ms**. HIT responses replay the generation-time Server-Timing value: do not treat cached values as new processing measurements. Timing boundaries are not a distributed trace or full CPU/billing measurement.

## Targeted intermediate width

At 412 CSS px / DPR 1.75, the 372 px catalog image needs about **651 physical px**; the original finite candidate set jumps from 640 to 960. Add **768**, shared by srcset generation and the server allowlist, retaining existing widths and all resource, geometry, quality, auth and cache bounds. Full-detail mobile also benefits when native selection chooses 768. This introduces one additional finite representation per source, increasing possible cache cardinality; it does not preload or transform every variant.

A regression exercises the actual server transform at 768, asserts 768×512 output for a 1200×800 fixture, and checks a srcset candidate covers the measured density. It fails at 400 before the implementation and passes afterward. The actual compiled route processes the same representative 622,842-byte retailer JPEG in twelve interleaved 960/768 calls with in-memory download. [Every local sample](./delivery-stages-2026-10-20/compiled-width-comparison.json). Output falls **46,012 → 34,390 bytes (25.3%)**, dimensions 960×716 →768×573, unchanged quality80/contained geometry. Local output was visually inspected. Local transform timing is not hosted cold-start or user quality acceptance.

Candidate **4252629** removes all timing probes. 146 tests, TypeScript, lint, production build and compiled no-React image isolation pass. Hosted native width selection, a fresh nine-run release series and correctness checks follow below. No gate is waived; #88 remains draft/unmerged.

## Hosted candidate verification

Measured implementation **425262987c62cf6193294beb71982ef25ca9985b**, deployment **7200847259**, unprimed preview. [All nine browser samples and method](./delivery-stages-2026-10-20/candidate-mobile.json). The actual browser selects **768** for catalog and both detail cases. Heavy output is **34,390 bytes**, matching the compiled comparison. No application/image smoke preceded the first navigation.

| Case | LCP runs (s) | Scores | Target-image cache |
| --- | --- | --- | --- |
| Catalog | **2.030**, 1.134, 1.089 | **98**, 100, 100 | MISS/HIT/HIT |
| Heavy detail | 1.371, 0.960, 1.272 | 100, 100, 100 | HIT/HIT/HIT |
| Light detail | 1.207, 1.098, 1.153 | 100, 100, 100 | MISS/HIT/HIT |

**Exit 0: all nine samples pass score ≥90, LCP ≤2.5 s and CLS ≤0.1.** CLS is zero throughout; first light-detail TBT is 8.835 ms, all other TBT zero. This is a passing preview lab series under the adopted method. It does not erase failed historical series or establish causal attribution for the full 2.588→2.030 s difference.

Crucial cold-state limit: [timestamp-window API records](./delivery-stages-2026-10-20/candidate-first-api.json) show two nearby **1,024 MiB** reports at 25.09 / 4.99 ms handler time with **no Init Duration**. The first image edge MISS is observed, but the backend is warm in this window. This is not verification of simultaneous cold API + cold web/image delivery; the earlier genuine cold API/navigation failure remains relevant. No forced retailer cold state, real-device/global matrix, field INP, accessibility matrix, user acceptance, actual billing or production web acceptance is claimed.

After measurement, [preview correctness](./delivery-stages-2026-10-20/candidate-continuity.json) passes 6 sequential / 12 concurrent locale cases, 7 canonical/Open Graph/responsive-priority-image cases and 5 original/optimized/error/repeat/304 probes. Both representative photo sizes preserve the original contained geometry. Candidate Linux CI, Vercel and both Socket checks pass. Temporary diagnostic response headers are absent.

[Twelve interleaved catalog HTTP reads](./delivery-stages-2026-10-20/catalog-http-comparison.json), all retained, compare immutable 27137b0 pre-width preview with candidate 4252629. Median total times **495.6 ms control / 396.4 ms candidate**; no >10% regression is observed in this small pair. Network/backend/platform state are uncontrolled, so this does not prove the absence of a route-response regression across conditions or clear all earlier response/resource gates. Emitted client JS gzip totals **185,977 B**, CSS **10,272 B** (individual asset gzip sums, not initial-route payload). JS is ~0.05% above the recorded original-main 185,879 B baseline; CSS unchanged.

**Status/next task:** scoped image optimization is implemented, tested and preview-measured. Web #88 remains draft/unmerged; production web stays #87. #86 and release parents remain open for cold-backend/first-source and controlled response/resource/cost verification, then exact-PR approval and production web measurements. Next capture should observe actual backend cold state and use available web runtime telemetry to separate outside-handler startup/scheduling/delivery, without forcing a production configuration change or reusing warmed image URLs as a fresh MISS claim. The passing warm-backend preview series is not permission to merge or deploy.
