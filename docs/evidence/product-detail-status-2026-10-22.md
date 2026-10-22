# Missing-product HTTP status — 22 October 2026

Issue: [#100](https://github.com/seancheong/takonbini-web/issues/100). Base production release: PR #99 / `322a1fe171280a45bbbbc110efa7293590bbd44c`. This record covers the local implementation and verification; merge and exact production verification remain separate gates.

## Diagnosis and change

The public API returned 404 for two sampled unavailable products while their standalone pages returned 500. A repeated public HTTP probe reproduced that mismatch. The server query adapter flattened confirmed absence into the same generic error as source failures; the standalone loader then reached the router error boundary. This matches the previously documented compatibility limitation and is not established as a regression from PR #99.

Both query transports now preserve confirmed HTTP 404 as `ProductNotFoundError`. Only the standalone loader converts that error to router `notFound()`, reusing the existing localized detail recovery component. Available products remain 200. Upstream server errors, invalid payloads and transport failures remain 500 with recovery controls. Modal failures stay inside the existing product modal boundary. The implementation uses the original query and does not add a second product read.

The built application also exposed a code-splitting problem: assigning the same recovery component to separate error/not-found lazy groups emitted empty component exports. Status-only checks missed this failure. The route now groups those two slots together, and CI asserts the rendered localized heading as well as the HTTP status.

## Automated evidence

- Meaningful route/server regression before the fix: the missing-product case failed (expected 404, received 500), while the available and upstream-failure cases passed. After the fix, route coverage includes missing, available, upstream 503, invalid payload and transport failure; each performs one upstream read.
- Final full suite: **29 files, 222 tests passed**. TypeScript, Biome lint, production build and `git diff --check` pass on local Node 24.16.0 / pnpm 10.20.0.
- `node scripts/check-product-detail-status.mjs` imports the emitted Vercel server artifact and passes **15 cases**: English/Japanese/Traditional Chinese × missing/available/upstream 503/invalid payload/transport failure. It checks exact status, document locale, rendered recovery/detail heading, retained Lawson catalog navigation and one upstream read. Synthetic fixtures contain no production records or retailer images.
- Negative compiled experiment: removing only the shared error/not-found split group, rebuilding, and running that check fails on the missing recovery heading/invalid component export. Restoring the final source, rebuilding and rerunning passes all 15 cases. The experimental source and build were replaced; no debug instrumentation remains.
- Compiled image isolation and native transforms pass without loading React SSR. Existing sharing verification passes **14 crawler-HTML cases** and native sharing-image fallback.
- Controlled local HTTP checks also return API 404 / standalone 404 for absence. These and the compiled artifact checks establish local behavior, not production deployment.

## Browser evidence

The compiled app ran against a private local synthetic fixture API, using a temporary in-app browser tab.

- Chinese standalone absence rendered `無法顯示商品`, `重試` and the filtered Lawson catalog return link. Locale and filters remained in the URL.
- Changing that fixture to available and retrying loaded its Chinese title and focused the loaded H1. The retry made exactly one additional upstream request.
- An English upstream-503 fixture retained the failure screen. After source recovery, retry loaded the product, focused its H1 and made exactly one additional upstream request.
- Entering a missing product from the catalog kept the failure inside one native modal, with catalog cards still mounted. Escape closed the modal, returned to the catalog URL and restored focus to the originating product link.

The temporary browser tab and fixture processes were closed after verification. Existing maintainer-reported iPhone 15 Pro/iPhone 17 and VoiceOver acceptance is preserved separately; these checks do not claim new real-device or exhaustive accessibility acceptance.

## Release gates

The specific implementation PR needs explicit maintainer merge approval. After merge, verify main CI and the exact production deployment: recheck the two issue IDs, an available product, localized recovery HTML and normal catalog/sharing behavior. Keep #100 open until those gates pass. Reconcile #27/#26/#29/#17/#5/#36 with the result and reassess/restart the applicable observation window after a new release. No production configuration, catalog data, storage, scraping schedule or delay investigation is part of this change.
