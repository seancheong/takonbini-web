# Responsive product images — 20 October 2026

Implementation for #86 extends draft #85. Not merged, not deployed to production, and no performance acceptance is inferred from unit tests.

## Delivery contract and bounds

- Server-only Sharp 0.35.5, using prebuilt native modules on supported Node runtimes. Nitro's local Vercel build traces the installed macOS native binaries; the hosted Linux preview must separately prove Linux packaging. No external image subscription is introduced.
- Only HTTPS, no credentials/nondefault ports, and exact hosts www.family.co.jp, www.lawson.co.jp, img-afd.7api-01.dp1.sej.co.jp, www.sej.co.jp. A complete 54-page public enumeration found 5,363 products/images, all HTTPS: 2,515 on the Seven-Eleven image host, 1,972 FamilyMart, 874 Lawson, and two on www.sej.co.jp. The latter two required extending the initial sampled allowlist. Enumeration is not a transactional database snapshot. Redirects are manual, every target revalidated, at most three redirects. This trusts those retailers' DNS and is not an arbitrary-host proxy.
- Widths 320/480/640/960/1280/1600, fixed WebP quality 80/effort 2, no enlargement or cropping; square bounding box preserves tall-image limits. Original product records remain unchanged. Requests without width retain bounded original raster passthrough for existing references. Raster signatures determine MIME rather than trusting retailer headers; a real Seven-Eleven JPEG is served upstream as application/octet-stream. Unsupported signatures are rejected before native processing.
- At most 8 MiB downloaded (declared and streamed checks); transformed inputs limited to 8 million decoded pixels and one still JPEG/PNG/WebP/AVIF image. SVG, unsupported/corrupt and multi-page images fail. Sharp uses one processing thread per image, a 16 MiB operation cache, no file cache, and a two-second processing timeout.
- Four active operations per server instance, at most 24 waiters with eight-second queue timeout. Upstream fetch/body budget ten seconds after admission; native processing has its separate timeout. These are per-instance limits, not a deployment-wide rate or total-memory ceiling.
- Success: one-day browser/seven-day shared cache plus one-day stale-while-revalidate, width included in URL. Transforms generate an ETag from output bytes; original ETag is not reused for changed bytes. Conditional matching can return 304 after computation. Errors are no-store; saturation returns 503 / Retry-After 5. No unbounded application cache or disk persistence.
- CPU/native memory and function duration increase on a cache miss. Source transfer is still required for each uncached width; browser transfer decreases. CDN hits should avoid function work, but actual cache behavior and billing must be measured. A native dependency increases server artifact size; it must not reach the browser bundle.

## Validation

Implementation measured: b9d9afb3da9d2c7c596ce2a16690530845e18390, [successful Linux preview deployment 7187531911](https://takonbini-5f76dqjjo-sean-cheong-zhen-xiongs-projects.vercel.app). Its Web CI and Socket checks passed. Follow-up 27855d1 fixes original-byte MIME detection; it does not change transformed bytes or catalog/detail srcsets. Final-head CI and the corrected passthrough are separately checked below rather than attributing measurements to an unmeasured revision.

All 136 tests, TypeScript and lint pass locally; production builds pass locally and in Linux CI. Regressions cover transforms/aspect ratio/no enlargement, allowed hosts, parameter bounds, redirects, encoded/decode limits, corrupt/vector input, validators, timeout, admission limits, queue expiry and actual upstream octet-stream originals. No production catalog write or scraper change occurred.

### Mobile navigation results

Twelve sequential fresh-profile runs: Lighthouse 13.4.1, supported Node 24.16.0, Headless Chrome 155, mobile 412×823 / DPR 1.75, simulated 150 ms RTT / 1638.4 Kbps / CPU 4×. Only performance category selected. Browser cache starts fresh; CDN/upstream caches are not forced cold. Raw reports/traces remain in /private/tmp/takonbini-mobile-performance; [sanitized per-run metrics/settings](responsive-images-2026-10-20/mobile.json) retain timestamps and provenance.

| Scenario | Median score | Median LCP | Median transfer | CLS |
| --- | ---: | ---: | ---: | ---: |
| Current heavy-image catalog | 94 | 2.730 s | 497,468 B | 0 |
| Filtered light-image catalog | 100 | 1.227 s | 279,781 B | 0 |
| Fixed heavy standalone detail | 96 | 2.708 s | 275,415 B | 0 |
| Fixed light standalone detail | 97 | 2.489 s | 268,769 B | 0 |

Every scenario has three runs. TBT medians are zero; first heavy catalog run has 40.6 ms. Heavy catalog scores 87/94/96 and LCP 3.263/2.730/2.672 s. Heavy detail LCP 2.726/2.708/2.679 s. Light detail LCP 2.577/2.135/2.489 s; its median passes but not every run does. Filtered light catalog includes the actual light product and a successful image response, but its LCP node is the heading; the search chip changes geometry. It is not interchangeable with the unfiltered heavy catalog.

**Performance acceptance is incomplete:** heavy catalog and detail fail the 2.5-second LCP target despite ≥90 median scores and zero CLS. The earlier unchanged production sample was 74 / 6.77 s / ~1.57 MB. This preview records substantially smaller payloads and lower sampled LCP; host, cache and sample timing differ, so that comparison is not an isolated causal effect. Remaining discovery/paint delay needs diagnosis; image-loaded state still depends on hydration. No claim that the specific remaining cause is proved. Do not remove loading/error feedback just to improve the score.

### Image quality, delivery and cost

Three real source samples: heavy Seven-Eleven 622,842 B → 26,540 B at 640 and 46,012 B at 960; light FamilyMart 105,889 B → 39,120 B at its native 600px; Lawson 279,028 B → 54,968 B at native 520px. No enlargement. Equal-size original/640 comparisons inspected at 372 CSS pixels preserve main packaging text and product detail with expected lossy texture differences. Source images/comparisons remain local in /private/tmp/takonbini-image-quality. This is representative visual review, not universal or objective quality certification.

In-app browser checks at 412×823 verified loaded first/subsequent card images, first-only high priority, product modal image and close/focus return. At 1280×900 the standalone detail loaded its 960 candidate in a ~670px canvas. Viewport override was reset and temporary tab closed. These are scoped browser checks, not a real-device/DPR/accessibility matrix.

A hosted optimized request returned 26,540 B / image/webp, followed by a CDN HIT; matching ETag returned 304 with no body. Unsupported width/extra option returned 400 / no-store. The first original passthrough probe returned 502 because upstream used octet-stream; that failure is retained and corrected by signature-based detection, not counted as acceptance. The corrected Linux preview at https://takonbini-kerusrisj-sean-cheong-zhen-xiongs-projects.vercel.app (27855d1, deployment 7187614976) returns original JPEG bytes 622,842 B / 200, optimized WebP 26,540 B / 200, repeat CDN HITs for both, 304 for the transform validator, and 400 / no-store for invalid options. See the before/after probe JSON. Single sequential timings were original MISS 2,346 ms, optimized MISS 760 ms; HITs 210/355 ms. They are noisy end-to-end observations, not isolated CPU or response-regression benchmarks.

All emitted client JS gzip: 185,879 → 186,145 B (+266 B / 0.14%) against the recorded main baseline. CSS gzip remains 10,279 B. This is all emitted assets, not initial-route transfer. No Sharp/libvips code appears in browser assets. Local macOS server artifact is ~20.8 MiB, including ~18.4 MiB @img native modules; Linux artifact size and actual billed CPU/memory are not inferred. Native processing increases cold-function work, while edge hits avoid repeat transform work. No total-cost or isolated >10% response-timing clearance is claimed.

### Remaining work

#86 remains open and #85 remains draft, unmerged and not production-deployed. Next: diagnose and reduce the remaining heavy catalog/detail discovery/paint delay, preserve truthful loading/error behavior, then repeat the failed LCP cases. Obtain exact-PR merge approval only after the draft is ready; production performance must then be measured separately. INP, other Lighthouse categories, broader accessibility/device coverage, actual billing, release observation and #24/#23 operational gates remain separate.

Official references: [Sharp installation and bundling](https://sharp.pixelplumbing.com/install/), [input/decode limits](https://sharp.pixelplumbing.com/api-constructor/), [operation timeout](https://sharp.pixelplumbing.com/api-output/#timeout).
