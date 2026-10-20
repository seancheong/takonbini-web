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

Hosted preview checks and repeated first-navigation mobile measurements follow. Do not infer that this clears the observed image MISS outlier, controlled production route-response gate, INP, field/device/accessibility or release observation gates. This change does not cache retailer sources or remove their cold fetch/processing cost. No production deployment or merge has occurred; exact-PR maintainer approval is required before merge.
