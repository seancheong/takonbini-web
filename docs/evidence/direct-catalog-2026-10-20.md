# Direct server catalog transport — 20 October 2026

Issue #86 remains open. This follow-up removes the server render's HTTP request through the web application's own `/api/products` proxy. Server catalog and detail queries now call the existing authenticated, validated ProductCatalogSource directly. Browser requests still use the same-origin public proxy. Query keys, filter encoding, pagination, freshness, API routes and upstream data are unchanged. Server credentials stay behind a compiler-enforced server boundary.

## Regression and compiled evidence

The new transport regression failed against unchanged main c9db64b: one catalog query issued two HTTP requests. It passes after the change with exactly one authenticated upstream request. Tests also cover direct detail validation/private-field stripping, missing credentials without fetch, invalid payloads and failed responses. Existing filter/browser-key-isolation and SSR-loader regressions remain passing. All 144 tests, TypeScript, scoped Biome checks and production build pass. Emitted static browser assets contain neither `PRODUCTS_API_KEY`, `x-api-key` nor the server query module identifier.

A compiled-artifact harness runs both unchanged main and candidate against the same public heavy-product fixture. It intercepts fetch, delays upstream responses by 25 ms and self-proxy responses by 50 ms, and invokes the actual built Vercel fetch handler. Each arm has two discarded warm-ups per route and ten measured samples per route. The page must return 200, include the product ID and omit the fixture credential. Both catalog and detail use two requests in control and one in candidate.

| Route | Control median | Candidate median |
| --- | ---: | ---: |
| Catalog | 85.22 ms | 30.88 ms |
| Detail | 84.46 ms | 31.00 ms |

These deliberately synthetic timings establish the removed-hop mechanism and bound this code path under fixed inputs. They are not estimates of Vercel latency, upstream production performance or cold image processing. Arm order is control/candidate build-dependent, not a randomized network experiment. No image requests are made by this SSR-only harness. Raw samples and the harness are in [the evidence directory](./direct-catalog-2026-10-20/). The harness expects an external public product JSON fixture; it embeds no production credentials.

All emitted client JS, individually gzip-compressed: 186,102 → 186,072 bytes (−30 B); CSS unchanged at 10,272 B. These are sums of emitted assets, not the initial route transfer. No dependencies or image-processing/cache/resource settings changed.

## Remaining acceptance

Hosted preview checks and repeated first-navigation mobile measurements are recorded below. Do not infer that this clears the observed image MISS outlier, controlled production route-response gate, INP, field/device/accessibility or release observation gates. This change does not cache retailer sources or remove their cold fetch/processing cost. No production deployment or merge has occurred; exact-PR maintainer approval is required before merge.


## Hosted preview checkpoint

Measured implementation: **75a7d6d476b43688f54dc96da478aabf89600ac4**, [PR #87](https://github.com/seancheong/takonbini-web/pull/87), [deployment 7188168928](https://vercel.com/sean-cheong-zhen-xiongs-projects/takonbini-web/2ZEycwqrJXFHPVaXibBAniFH2YqE). Web CI 39346665919, Vercel and both Socket checks pass. No merge or production deployment. Later evidence-only commits retain this measured implementation.

Nine sequential Lighthouse 13.4.1 performance-only runs, identical prior method (fresh Chrome profiles, 412×823 / DPR 1.75 / simulated 150 ms RTT / 1638.4 Kbps / CPU 4×):

| Case | Scores, all runs | LCP, all runs (s) | Median LCP | LCP image cache |
| --- | --- | --- | ---: | --- |
| Heavy catalog | 85, 100, 100 | 3.229, 1.446, 1.380 | 1.446 s | MISS/HIT/HIT |
| Heavy detail | 97, 97, 100 | 2.146, 2.137, 1.245 | 2.137 s | HIT/HIT/HIT |
| Light detail | 97, 100, 100 | 2.520, 1.261, 1.241 | 1.261 s | MISS/HIT/HIT |

CLS is zero in every run, TBT ranges 0–3 ms; TBT is not INP. Median score/LCP targets pass, but the first catalog and light-detail runs still fail 2.5 s. Heavy detail's first request was already an edge HIT after catalog requested the same 960px URL; it is not independent cold-source coverage. All samples are retained. Raw reports/traces remain local; sanitized per-run/cache metadata is in mobile-preview.json. This cross-host result cannot establish that the whole median change was caused by the removed hop.

First catalog's image MISS took 1,065 ms to response headers versus 56/33 ms on subsequent HITs. Light detail MISS took 1,069 ms versus 26/60 ms. Headers identify a `sin1::iad1` path: Singapore edge forwarding to a US function is a concrete candidate for the next regional-latency experiment, not a proved root cause or an approved configuration change. The image is eager/high priority and discoverable in the initial document according to Lighthouse.

Six alternating-order HTTP pairs per route compare immutable production c9db64b and preview 75a7d6d: catalog median total time 1,108.4 → 847.9 ms; detail 554.0 → 558.6 ms (+0.8%). Both return 200. Connection setup, instance state, cache and upstream/network effects remain uncontrolled. This does not retroactively clear the earlier pre-image/native-image route-response acceptance gate. Fixed-fixture compiled evidence above isolates only this change's removed self-proxy hop.

Scoped hydrated-browser checks: catalog loads; Load more increases count from 20 to 40; product dialog displays the expected loaded h1; no captured console warnings/errors. This is agent QA, not new user-reported acceptance or a full device/accessibility matrix.

Five local macOS Node 24/Sharp 0.35.5 samples separate retailer fetch (436.8, 65.5, 76.6, 97.7, 66.7 ms) from 640px transform wall time (102.9, 51.9, 38.8, 36.2, 38.4 ms). Every input is 622,842 B and output 26,540 B. Upstream cache state is unknown. Local CPU samples are recorded in microseconds; these are not Vercel resource/cost estimates. No resource/cache setting changes are part of this PR.

The benchmark harness takes `node compiled-benchmark.mjs CHECKOUT OUTPUT_JSON PUBLIC_PRODUCT_FIXTURE_JSON`. Use the same public product fixture for both arms. Only the harness fixture credential is embedded; it never accesses production credentials.

**Next:** review PR #87 for the scoped server-transport change; exact-PR approval is required before merge, followed by production verification. Continue #86 with a controlled function-region/cold-image latency experiment and retain the unresolved cold-source, broader response/cost and parent acceptance gates.
