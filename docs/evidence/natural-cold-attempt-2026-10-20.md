# Natural cold-state capture attempt — 20 October 2026

The maintainer requested a cold-state capture attempt. No production configuration, application code, resource, routing, concurrency or authentication change was made. The agreed unchanged nine-run Lighthouse harness targeted previously unvisited evidence-only preview **a518635f07f8688151ab0d99d36e22d57947dea2 / deployment 7200972756**. Its implementation matches measured 4252629. No API/HTML/image smoke request primed this preview before its first navigation; metadata and logs were read without invoking application code.

## First capture: image MISS, backend cold state not observed

At **2026-10-20T13:31:32.780Z**, first catalog LCP is **1,381.078 ms**, score **100**, CLS **0**, TBT **1.669 ms**. The actual 768px image returns **34,390 bytes / WebP / edge MISS**, browser disk cache false. Document final headers arrive **612.808 ms** after request start; image final headers arrive **282.520 ms** after image request start. No diagnostic Server-Timing header remains.

The narrow read-only API timestamp window contains one **1,024 MiB** REPORT: **27.45 ms** handler, **28 ms** billed, **157 MiB** peak, **no Init Duration**. Therefore a cold API invocation was **not observed**; the passing sample must not be counted as simultaneous cold-backend plus uncached-image acceptance. Correlation is by narrow timestamp/order, not distributed tracing. An image edge MISS also does not establish cold retailer-origin or web-runtime state.

[Sanitized API correlation](./natural-cold-attempt-2026-10-20/api-correlation.json), [all browser samples and pinned method](./natural-cold-attempt-2026-10-20/mobile.json), [first-request timing](./natural-cold-attempt-2026-10-20/first-request-timing.json).

The existing nine-run series is retained in full; no run is selected away. A repeated warm-backend pass is useful continuity evidence, not the missing cold-state gate. Existing correctness, software and implementation CI results are not rerun solely for evidence-only changes.

## Complete series and outcome

| Case | LCP runs (s) | Scores | Target-image cache |
| --- | --- | --- | --- |
| Catalog | 1.381, 1.219, 1.240 | 100, 100, 100 | MISS/HIT/HIT |
| Heavy detail | 1.509, 2.026, 1.273 | 100, 98, 100 | HIT/HIT/HIT |
| Light detail | 1.075, 1.080, 1.152 | 100, 100, 100 | MISS/HIT/HIT |

All nine samples pass; command exits **0**. CLS zero throughout; only first catalog TBT is nonzero at 1.669 ms. TBT is not field INP. The slower heavy-detail repeat is retained. This is a second passing preview series, not a cold-API success or production-web release verification.

**Attempt complete; cold gate unresolved.** Application requests were stopped after the series. Next #86 action is another fresh-preview capture after an idle opportunity, paired with actual initialization records; arbitrary elapsed time cannot guarantee Lambda cold state, and ordinary traffic may keep it warm. Do not force a production configuration change or count another warm invocation as acceptance. Controlled response/resource/cost review, specific #88 merge approval and production web verification remain separate. #88 stays draft/unmerged; #86/#17/#26/#27/#29 remain open and #5/#36 keep historical closed states. No new user-reported UX acceptance or stable observation window is inferred.
