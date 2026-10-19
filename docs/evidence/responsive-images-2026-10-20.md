# Responsive product images — 20 October 2026

Implementation for #86 extends draft #85. Not merged, not deployed to production, and no performance acceptance is inferred from unit tests.

## Delivery contract and bounds

- Server-only Sharp 0.35.5, using prebuilt native modules on supported Node runtimes. Nitro's local Vercel build traces the installed macOS native binaries; the hosted Linux preview must separately prove Linux packaging. No external image subscription is introduced.
- Only HTTPS, no credentials/nondefault ports, and exact hosts www.family.co.jp, www.lawson.co.jp, img-afd.7api-01.dp1.sej.co.jp. Actual samples from all three stores confirmed these sources. Redirects are manual, every target revalidated, at most three redirects. This trusts those retailers' DNS and is not an arbitrary-host proxy.
- Widths 320/480/640/960/1280/1600, fixed WebP quality 80/effort 2, no enlargement or cropping; square bounding box preserves tall-image limits. Original product records remain unchanged. Requests without width retain bounded original raster passthrough for existing references.
- At most 8 MiB downloaded (declared and streamed checks); transformed inputs limited to 8 million decoded pixels and one still JPEG/PNG/WebP/AVIF image. SVG, unsupported/corrupt and multi-page images fail. Sharp uses one processing thread per image, a 16 MiB operation cache, no file cache, and a two-second processing timeout.
- Four active operations per server instance, at most 24 waiters with eight-second queue timeout. Upstream fetch/body budget ten seconds after admission; native processing has its separate timeout. These are per-instance limits, not a deployment-wide rate or total-memory ceiling.
- Success: one-day browser/seven-day shared cache plus one-day stale-while-revalidate, width included in URL. Transforms generate an ETag from output bytes; original ETag is not reused for changed bytes. Conditional matching can return 304 after computation. Errors are no-store; saturation returns 503 / Retry-After 5. No unbounded application cache or disk persistence.
- CPU/native memory and function duration increase on a cache miss. Source transfer is still required for each uncached width; browser transfer decreases. CDN hits should avoid function work, but actual cache behavior and billing must be measured. A native dependency increases server artifact size; it must not reach the browser bundle.

## Validation

Pending hosted preview, representative quality checks, repeated mobile measurements and bundle comparison. Existing broader INP/accessibility/device/operational gates remain separate.

Official references: [Sharp installation and bundling](https://sharp.pixelplumbing.com/install/), [input/decode limits](https://sharp.pixelplumbing.com/api-constructor/), [operation timeout](https://sharp.pixelplumbing.com/api-output/#timeout).
