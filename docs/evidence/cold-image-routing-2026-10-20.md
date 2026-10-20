# Cold catalog and image routing — 20 October 2026

PR #88 remains draft. Moving image delivery outside the React router improves a controlled local startup measurement but does **not** clear the hosted cold-catalog gate. No merge or production deployment is authorized by this evidence. Production remains #87 / 0b6d03d.

## Diagnosis and bounded change

The lazy-only TanStack handler at 1dbf49b reduced local compiled SSR startup, but its hosted agreed-method series still failed: catalog LCP **3.409** / 1.355 / 1.300 s, scores 86/100/100, image MISS/HIT/HIT. Heavy detail was 1.373/1.340/1.243 s; light detail 1.229/1.098/1.217 s. CLS/TBT were zero. [All samples](./cold-image-routing-2026-10-20/lazy-mobile.json) remain preserved; this was not a successful release fix.

The next falsifiable hypothesis was that an image request unnecessarily initializes the React SSR graph. A compiled import hook rejecting React/React DOM/router modules makes the old route return 500; the direct Nitro route returns the expected 400 for a missing target and a genuine Sharp WebP for a valid local fixture without importing those modules. `scripts/check-image-isolation.mjs` now runs after the Linux CI build. A unit regression also proves unsupported methods do not initialize the image pipeline and GET delegates the exact Request.

At cace88789ef991a029dac0f2246701a9827cae89, Nitro matches `/api/image` before its SSR catch-all, then lazily imports the unchanged bounded processor. The emitted deployment still has **one Node function**, not a separate image function. No dependency, data, scheduler, persistent cache or image resource limit changed. GET/HEAD are supported; other methods return 405/no-store. The generated TanStack route entry was removed. Temporary request timing middleware and response headers were removed before this measured candidate.

Six alternating fresh local Node processes exercised actual compiled old/current handlers with the same local PNG and zero-delay mocked retailer fetch. Cold image times were control 111.9/65.5/63.9 ms and candidate 53.4/31.8/31.2 ms; warm requests were about 3 ms. Every output ETag matched. [All local samples](./cold-image-routing-2026-10-20/native-image-cold.json). OS caches and function state were not forced; this is mechanism evidence, not a Vercel latency or billing estimate.

## Delivery timing and interpretation

Temporary preview-only probes separated source time from the surrounding request. The first proxy request took 840 ms total, with 175 ms inside the catalog source; subsequent source times were 53–88 ms. The first root request took 1,301 ms total, with 512 ms inside request middleware and 363 ms inside the catalog source. Later app times were 97–114 ms and source times 50–82 ms. The middleware interval ends when the Response is created, not when its streamed body finishes. Network, TLS, platform startup and streaming remain outside or overlap these intervals; subtraction cannot attribute the remainder solely to web bootstrap. [Proxy samples](./cold-image-routing-2026-10-20/catalog-source-probe.json), [root samples](./cold-image-routing-2026-10-20/root-timing-probe.json). No production writes or credentials were recorded.

Vercel emits an early HTTP 103 before final document headers. In the native candidate's first catalog capture, header-start is ~174 ms but final header-end is ~1,902 ms; the image begins around 1,930 ms. Lighthouse labels much of that interval as resource load delay and reports an understated document TTFB. Its breakdown is 175 ms TTFB, 1,755 ms discovery delay, 1,263 ms image load and only 7 ms render delay. This failure is a delivery waterfall, not the earlier long post-download presentation interval. Raw reports/traces remain in `/private/tmp/takonbini-native-image-mobile`.

## Hosted release check

Measured immutable preview cace887 / deployment 7197391380: [native image route preview](https://takonbini-iehmzmqtk-sean-cheong-zhen-xiongs-projects.vercel.app). [Web CI 39408259519](https://github.com/seancheong/takonbini-web/actions/runs/39408259519), Vercel and both Socket checks pass. Local 145 tests, types, lint and production build pass. The first successful image URL was not manually fetched before the audit. The adopted external-runtime, Chrome-default-feature applied-throttling command used fresh profiles sequentially; edge/function/retailer cold state was observed, not forced.

[All nine samples](./cold-image-routing-2026-10-20/native-mobile.json) are retained. CLS and TBT are zero throughout.

| Case | LCP runs (s) | Scores | Image cache |
| --- | --- | --- | --- |
| catalog | 3.201, 1.394, 1.324 | 88, 100, 100 | MISS / HIT / HIT |
| heavy-detail | 1.458, 1.396, 1.360 | 100, 100, 100 | HIT / HIT / HIT |
| light-detail | 1.279, 1.091, 1.079 | 100, 100, 100 | MISS / HIT / HIT |

 The first catalog sample is **3.201 s / score 88 / MISS**, so the all-sample command fails regardless of passing medians. TBT is not INP; no physical-device or global-user acceptance follows from these lab results.

Hosted continuity passes six sequential and twelve concurrent locale cases, seven canonical/Open Graph/responsive-image cases and five original/optimized/cache/error/304 image probes. [Results](./cold-image-routing-2026-10-20/continuity.json). Missing-target HEAD returns 400/no-store and POST returns 405/no-store with GET, HEAD allowed; [method results](./cold-image-routing-2026-10-20/methods.json). These are preview correctness checks, not production acceptance.

## Remaining work

Keep #86 and #17/#26/#27/#29 open and #88 draft. Next isolate the final-document/header wait and first uncached image delivery with controlled cold/warm conditions, then make a justified change and rerun the release gate. Do not add unbounded prefetching or weaken bounds to hide the first sample. The original simulated failures and both unsuccessful follow-ups remain evidence. Higher published Tokyo per-unit rates, actual resource/cost acceptance, device/INP/accessibility/global coverage and production verification remain open. Exact PR merge approval is still required.


## Subsequent experiment

The [catalog streaming follow-up](./catalog-streaming-2026-10-20.md) sent the shell earlier but still failed the first catalog sample at 4.258 s and introduced a duplicate-heading raw-HTML regression. It was reverted; the native image-route implementation above remains the application baseline. No new passing release claim or production deployment follows from that experiment.
