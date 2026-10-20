# Catalog streaming experiment — 20 October 2026

The streaming experiment failed the adopted mobile release gate and the existing raw-HTML heading check. It was reverted in **ba2edbf**. PR #88 remains draft and unmerged; #86 stays open. Production remains #87 / 0b6d03d. The native image-route isolation and earlier evidence remain intact.

## Predictions and checks

The ranked hypotheses were cold SSR initialization, catalog-source latency, and surrounding platform/network delivery. A fresh local process with a fixed 25 ms catalog source produced first HTML in about 171 ms and a repeat in 31 ms; this is not a hosted estimate. A CPU profile found ~39 ms in a product-display chunk's initialization, including Intl setup, which does not account for the hosted ~1.90-second final-header wait by itself.

On previously unvisited evidence-only preview ffd333a / deployment 7197518486, a lightweight missing-target native image request took 1,338 ms total, then first SSR 1,335 ms and repeat SSR 794 ms; a repeated invalid-image request took 448 ms. That route loads neither React nor catalog data. Requests used fresh urllib HTTPS connections and did not fetch successful image URLs. Network/function/source cold state was not forced, and this is not a matched-pair causal comparison. [Every sample](./catalog-streaming-2026-10-20/bootstrap-http.json).

The next prediction was that streaming the stylesheet and existing loading shell while data remained pending could overlap CSS delivery with the source wait. A compiled check held the source unresolved: baseline returned no response within the one-second guard, while candidate emitted an initial 2,042-character chunk containing the stylesheet before source release. Its final fixture HTML contained the product, used one source request and excluded the fixture credential. The check proves streaming behavior, not a 2.5-second LCP pass.

Experiment **4adb7d1100da13ac8c85532b1910005c49436005** returned the pending prefetch completion from the SSR route loader and used an Await boundary with the existing CatalogScreen fallback. Browser route loaders continued to await prefetch. No cache, dependency, image settings, API, scheduler or data changes were made. All 146 tests, types, lint and build passed, including a two-environment loader regression; [Web CI 39414391376](https://github.com/seancheong/takonbini-web/actions/runs/39414391376), Vercel and both Socket checks passed. The compiled shell check was included in that CI.

## Hosted result: keep the failure

Measured [immutable preview](https://takonbini-mk1qv1rcs-sean-cheong-zhen-xiongs-projects.vercel.app), deployment **7198369138**, using the adopted Chrome-default-feature applied-throttling method. No successful image requests preceded the series. [All nine samples/settings/cache observations](./catalog-streaming-2026-10-20/mobile.json); raw reports and traces remain in `/private/tmp/takonbini-streaming-mobile`.

| Case | LCP runs (s) | Scores | Image cache |
| --- | --- | --- | --- |
| Catalog | **4.258**, 1.797, 1.308 | 85, 99, 100 | MISS/HIT/HIT |
| Heavy detail | 1.956, 1.440, 1.333 | 99, 100, 100 | HIT/HIT/HIT |
| Light detail | 1.645, 1.159, 1.220 | 99, 100, 100 | MISS/HIT/HIT |

CLS is zero throughout. Catalog TBT is 79.9/24.5/17.0 ms; other TBT is zero. TBT is not INP. The command returns exit 1 because the first catalog fails both score and LCP. Eight passing samples do not erase that result.

First catalog final headers arrive around 1,200 ms and initial document data at 1,225 ms; FCP is 1,742 ms. But later document data arrives at 3,440–3,520 ms and the critical image starts at 3,508 ms, finishes after another ~740 ms and renders ~9 ms later. Main JS finishes around 2,768 ms. Earlier headers did not mean earlier product discovery. This does **not** isolate the gap to backend computation: streaming/buffering, bandwidth competition, request scheduling and source delay can overlap. [Sanitized timing](./catalog-streaming-2026-10-20/catalog-timing.json).

The existing locale probe also fails on the first case: `html[lang]` is correctly Japanese, but raw HTML contains the catalog heading twice (fallback and resolved Suspense markup). This is not proof of two visible headings after browser reveal; it is a raw-HTML compatibility regression. The rest of that continuity series was stopped and is not claimed passing. [Retained failure](./catalog-streaming-2026-10-20/continuity-failure.json).

## Revert and next evidence

Revert ba2edbf removes the loader/Await experiment, its test changes, compiled streaming script/CI step and design-doc addition. The app tree returns to ffd333a's native image-route implementation. The revert tree exactly matches ffd333a (tree 8590ec617940bfd3b11cdd6f166c8316d6dbd052). Local 145 tests, types, lint, build and compiled image isolation pass. [Revert CI 39414957971](https://github.com/seancheong/takonbini-web/actions/runs/39414957971), Vercel and Socket checks pass. Revert preview 7198467290 passes the original six sequential/twelve concurrent locale cases, seven SEO/responsive-image cases and five image/cache/error/304 probes; [all results](./catalog-streaming-2026-10-20/rollback-continuity.json). No production deployment occurred. Earlier [3.201-second cold failure and passing native-route continuity](./cold-image-routing-2026-10-20.md) remain the current measured release status; this revert is not a new passing performance claim.

Next distinguish backend duration from delivery delay with read-only hosted timing before another application change. The local AWS session reports expiration and needs `aws login --profile default`; the maintainer was asked to refresh it. Vercel CLI reads return 403 and the browser lookup reaches login, so the project's active compute settings are not verified or changed. Vercel documents production-only bytecode caching and production pre-warming; preview timings therefore cannot establish production cold-start equivalence ([official Fluid compute documentation](https://vercel.com/docs/fluid-compute)). No gate is waived on that basis.

Exact-PR merge approval, post-merge production verification, controlled response/resources/cost acceptance and the existing device/INP/accessibility/global/observation limits remain. #24's next nominal scheduled opportunity remains 21 October 02:00 Malaysia time, subject to GitHub delay; #23's stable 30-day window has not started.
