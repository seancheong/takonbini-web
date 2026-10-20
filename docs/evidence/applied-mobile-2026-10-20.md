# Adopted applied-throttling release checks — 20 October 2026

The maintainer explicitly answered **“Adopt the documented applied-throttling method”** after reviewing the first-frame diagnosis. This authorizes that measurement method for #86's next release checks, retaining every original simulated failure and remaining cold-source/device limitations. It is **not** merge approval, new user-reported UI acceptance or permission to declare all gates passed.

This supersedes the method-decision-pending status in the historical first-frame evidence. [The diagnosis](./first-frame-2026-10-20.md) and [original regional comparison](./regional-latency-2026-10-20.md) stay intact. PR #88 remains draft because the new release run still has a cold-catalog failure.

## Repeatable command

[scripts/measure-mobile.mjs](../../scripts/measure-mobile.mjs) uses an external pinned Lighthouse runtime instead of adding audit dependencies to the product. Use supported Node 24.16, Lighthouse 13.4.1, chrome-launcher 1.2.2 and the recorded Chrome version (this series: Chrome 155). `LIGHTHOUSE_RUNTIME_ROOT` is the package directory containing those installed audit dependencies; `CHROME_PATH` selects the Chrome binary.

```sh
LIGHTHOUSE_RUNTIME_ROOT=/path/to/audit-runtime \
CHROME_PATH=/path/to/chrome \
node scripts/measure-mobile.mjs https://deployment.example /tmp/mobile-audit
```

The command launches fresh isolated profiles sequentially, ignores launcher default flags, and passes only `--headless --disable-gpu --no-first-run`. Actual spawn arguments are checked for unexpected feature overrides and retained with temporary profile/port redacted. Lighthouse applies mobile 412×823 / DPR 1.75, requested network latency 150 ms, download 1638.4 Kbps, upload 750 Kbps and CPU 4× through DevTools. It selects performance only and keeps cc/viz trace categories consistent with the reviewed diagnostic. Full effective settings and user agent are retained.

Three runs per catalog/heavy-detail/light-detail case are recorded, including image cache state. Raw reports, traces and logs stay in the requested output directory; the sanitized summary is written after every completed sample. Runtime/audit errors stop the command, and every completed result remains available. If any sample has score <90, LCP >2.5 s or CLS >0.1, the command returns nonzero after the series. Medians do not hide individual failures. TBT is recorded but is not INP. No application or audit-detection behavior is added to the website.

## First agreed-method preview series

Measured immutable head **b10a1f39dc887b9e9e21be1676ff63c9b08ed418**, deployment **7193890015**, [Tokyo preview](https://takonbini-owlmljb51-sean-cheong-zhen-xiongs-projects.vercel.app). Its application/region implementation remains 5775679; later commits record evidence only. Web CI 39385496528, Vercel and both Socket checks pass at the measured head.

| Case | LCP runs (s), all retained | Median LCP | Scores | Target-image cache |
| --- | --- | ---: | --- | --- |
| Catalog | **2.772**, 1.367, 1.282 | 1.367 s | 93, 100, 100 | MISS/HIT/HIT |
| Heavy detail | 1.452, 1.231, 1.316 | 1.316 s | 100, 100, 100 | HIT/HIT/HIT |
| Light detail | 1.140, 1.124, 1.190 | 1.140 s | 100, 100, 100 | MISS/HIT/HIT |

CLS and TBT are zero in all nine. Target-image browser disk cache is false. All medians pass and eight of nine samples pass; **the command returns exit 1 because the first catalog run fails 2.5 s**. Heavy detail is already an image HIT after catalog; it is not independent cold-source coverage. An edge MISS does not prove a cold retailer CDN or a particular function instance state. No physical-device, INP, field or global-user acceptance follows from these lab results.

The cold catalog breakdown is approximately 151 ms TTFB, 1,312 ms resource discovery delay, 1,291 ms resource load and 18 ms render delay. The target image MISS reaches headers about 765 ms after request start. The immediate remaining failure is therefore a catalog/data/image delivery critical path, unlike the long post-download presentation interval isolated earlier. This does not assign the whole discovery interval to a particular API/SSR/bootstrap cause without further instrumentation.

## Follow-up

The [cold image-routing investigation](./cold-image-routing-2026-10-20.md) preserves the unsuccessful lazy-only and direct-Nitro preview series. The latter passes compiled React isolation and all correctness checks but still fails its first catalog sample at 3.201 s. It does not supersede this initial failed run with a passing release claim. Vercel early HTTP 103 also means the breakdown above understates final-document header waiting; see the follow-up timing interpretation.

## Current decision and next task

Keep #88 draft and #86 open. Adoption of a better-documented measurement method did not automatically make the release green; the audit's failure result is preserved. Next diagnose and reduce the first catalog navigation's SSR/data/image discovery-and-load waterfall under the adopted method, without weakening bounds, hiding the slow run or adding speculative unbounded work. Re-run failed conditions after a justified change.

The existing regional response benefit, explicit higher published Tokyo per-unit rates and resource/cost/global-device limitations remain. Exact-PR approval is still required before any merge, then production verification under the adopted method. No production deployment or product-data change occurred in this follow-up.
