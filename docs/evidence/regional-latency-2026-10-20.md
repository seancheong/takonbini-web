# Regional latency experiment — 20 October 2026

Continues #86. The current image MISS headers report Singapore edge / Washington US function (`sin1::iad1`); catalog data lives in Tokyo ([ADR 0005](../adr/0005-use-on-demand-dynamodb-with-rebuild-recovery.md)). The hypothesis is that a Tokyo function reduces trips between the function and its Japan-based dependencies. This requires measurement; geographic proximity alone is not acceptance.

The control preview explicitly pins `vercel.functions.regions` to `iad1`, preserving the observed production region. The candidate changes only that value to `hnd1`. Both use the same merged #87 application implementation, image transform/cache/resource bounds, API and catalog data. Production stays unchanged until an explicitly approved PR merge.

Compare sequential fresh-profile mobile Lighthouse catalog/heavy-detail/light-detail runs and observe actual image cache state. A detail URL may already be warm after the catalog; do not label it source-cold. Independently compare previously unused image URL/width keys across both deployments, alternating order, recording MISS/HIT, bytes, ETag, region and response times. Do not add arbitrary cache-busting parameters or mutate data. Include all samples and slow cases. Remote networking and instance/upstream state remain uncontrolled; a regional association is not isolated per-component CPU evidence.

Verify generated `.vc-config.json`, deployed function region, SSR/SEO/locale/browser continuity, and unchanged browser assets. This moves the shared server function, including SSR/API/image routes; it does not add regional replication or paid services. It may change latency for users elsewhere and regional compute pricing; actual billing and global user performance remain separate gates.

Configuration sources: [Nitro Vercel function settings](https://nitro.build/deploy/providers/vercel), [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region), [Vercel region codes](https://vercel.com/docs/regions). The installed Nitro types support `vercel.functions.regions`; the emitted artifact and real deployment will be checked rather than relying on docs alone.


## Cost and release boundaries

No plan upgrade, extra region, paid service or resource-limit increase is introduced. As checked on 20 October, Vercel's published Pro on-demand rates are $0.128 → $0.202 per active CPU hour (+57.8%) and $0.0106 → $0.0167 per GB-hour provisioned memory (+57.5%) for Washington → Tokyo. Sources: [Washington pricing](https://vercel.com/docs/pricing/regional-pricing/iad1), [Tokyo pricing](https://vercel.com/docs/pricing/regional-pricing/hnd1). These rates are not the project's actual plan, included allowances or bill; no paid charge or net saving is inferred. Client-edge pricing also depends on the edge region serving the user, so moving the origin does not relocate every CDN request. Actual billed usage, resource consumption and the stable cost window remain unaccepted.

The initial no-store invalid-width probes verify `iad1` versus `hnd1` without warming any successful image URL. They do invoke each server function; the subsequent image requests test cold output-cache keys, not guaranteed cold function instances or cold retailer CDN caches. No explicit cache purge or synthetic cache-busting is used.


## Measured preview result: retain draft

[Draft PR #88](https://github.com/seancheong/takonbini-web/pull/88) has two immutable previews:

- Control **3cbd3d0122b953c9b44a5b17db01270b8f36e150**, deployment **7188342388**, [US preview](https://takonbini-hgsaoki0k-sean-cheong-zhen-xiongs-projects.vercel.app), Web CI **39347872086**.
- Candidate **577567964c6d7fcc31af6d893ab2a82498d2a07b**, deployment **7188355717**, [Tokyo preview](https://takonbini-ad0msa2cd-sean-cheong-zhen-xiongs-projects.vercel.app), Web CI **39347954451**.

Both CI/deployments pass; candidate also passes both Socket checks. Local 144 tests, type checking, lint and production build pass. Generated function configs differ only by region; all emitted static asset names and SHA-256 hashes are identical. JS gzip remains 186,072 B and CSS 10,272 B. No UI change occurred. No merge or production deployment is authorized by this experiment.

### Eighteen standard mobile samples

Lighthouse 13.4.1, supported Node 24.16, Chrome 155, performance category only; sequential fresh browser profiles, mobile 412×823 / DPR 1.75 / simulated 150 ms RTT, 1638.4 Kbps and CPU 4×. Arm order alternates by run. Neither successful image URL was manually fetched before this series; the no-store validation probes did invoke the functions. All eighteen reports are included; raw HTML/JSON/traces remain local, sanitized samples are in mobile-comparison.json.

| Case | US LCP runs (s) | Tokyo LCP runs (s) | US median score / LCP | Tokyo median score / LCP |
| --- | --- | --- | --- | --- |
| Heavy catalog | 3.550, 1.743, 1.265 | 2.202, 2.730, 1.285 | 99 / 1.743 s | 98 / 2.202 s |
| Heavy detail | 2.143, 2.190, 2.138 | 1.235, 1.235, 2.126 | 98 / 2.143 s | 98 / 1.235 s |
| Light detail | 2.633, 2.144, 1.237 | 2.854, 1.248, 2.730 | 97 / 2.144 s | 95 / 2.730 s |

CLS is zero throughout; TBT is 0–28 ms across both arms, not INP. Heavy catalog and light detail have MISS/HIT/HIT for both arms; heavy detail is HIT/HIT/HIT after catalog requested the same image URL. Browser disk cache is false for the recorded target image responses. The first catalog image response headers improve 1,035 → 339 ms, and first light image 767 → 187 ms. **The regional change does not pass the overall LCP gate:** Tokyo light-detail median is 2.730 s and catalog median is slower than control. Do not discard these failures or claim a universal regional LCP improvement.

### Matched image and HTTP probes

After Lighthouse, twelve new product/source/480px keys (four per retailer) were requested first and then repeated in alternating arm order, 48 responses total. Some nominal first requests were already HITs; all results are retained. The eight pairs actually observed as MISS/MISS have median total HTTP time **673.5 ms US → 297.8 ms Tokyo**, and Tokyo is faster in all eight. All twelve first-request medians, including mismatched/HIT states, are 511.9 → 311.9 ms; those mixed states are not a cold-cache comparison. Every repeated request is HIT; repeat medians are 106.0 → 106.6 ms. Every corresponding pair has byte-identical WebP and ETag. The deployed function paths are `sin1::iad1` and `sin1::hnd1`.

The earlier direct-probe attempt used a page-shaped Lawson fixture where a product was expected, stopping before results were saved. Its already-requested heavy/light width keys were excluded from the subsequent twelve-key experiment; no timings are reconstructed for that failed attempt. The corrected run saves each sample incrementally. This history is retained in image-comparison.json.

Six alternating-order HTTP pairs per route: catalog median total time **822.1 → 407.8 ms**, detail **543.0 → 323.5 ms**. These are sequential remote observations with uncontrolled connections, upstream/instance state and networking. They support a regional response-time benefit in this environment, not global-user, CPU or billing acceptance. There is no static bundle increase; the earlier broader response/native-resource/cost acceptance remains open.

### Remaining frame-presentation delay

In Tokyo light-detail standard run 3, the image finishes around 321 ms, a PaintImage event occurs around 347 ms and WebP decoding takes about 3.5 ms. First paint/FCP/LCP is only presented around 1,354 ms; no >50 ms main-thread event is recorded during that interval. This bounds the remaining investigation beyond source download and decode; it does not prove a browser fault or that all application paint conditions are satisfied.

An [open Lighthouse report](https://github.com/GoogleChrome/lighthouse/issues/17148) describes similar delayed first-frame presentation. Treat it as a reported hypothesis, not a maintainer-confirmed diagnosis of this site. The installed chrome-launcher defaults disable RenderDocument. A separate six-run site-unchanged diagnostic explicitly supplies the entire installed default flag list with automatic defaults ignored, changing only the configured RenderDocument disable/enable setting; both arms also collect extra cc/viz trace categories.

| Diagnostic arm | Simulated LCP runs (s) | Observed LCP runs (s) |
| --- | --- | --- |
| Existing launcher setting | 2.890, 1.231, 2.150 | 1.532, 0.586, 0.457 |
| RenderDocument enabled | 1.978, 1.993, 2.014 | 0.542, 0.475, 0.594 |

This small bounded series is consistent with a launcher/browser contribution to one delayed presentation; it is not statistical proof, an app fix or evidence of Chrome's exact internal throttling reason. Requested flag lists are retained, not independently captured process command lines. **These diagnostic runs cannot replace the standard acceptance series above.** No browser flag or audit-detection workaround is added to the site. No physical-device or stock-browser field acceptance is claimed.

## Decision and next task

Keep PR #88 draft and #86 open. Tokyo demonstrably improves the observed cache-MISS and route-response samples, but overall mobile acceptance remains mixed and the published regional pricing tradeoff remains explicit. Production stays at merged #87 revision 0b6d03d.

Next investigate the first-frame presentation interval with a controlled stock-browser/applied-throttling measurement and trace validation, separating test-environment effects from genuine application work. Preserve the standard failures and agree any measurement-method change explicitly; do not silently substitute a diagnostic score. Parent INP/device/accessibility/observation and actual resource/cost gates remain. After a release-ready decision, exact-PR approval is required before merge, followed by production verification. Rollback is to restore the prior region configuration and redeploy, then verify the actual function region; do not assume the dashboard default is immutable.


## Continuity checks

Tokyo preview passes six sequential and twelve concurrent locale-precedence checks with matching document language and heading, seven catalog/detail canonical/Open Graph/responsive-priority image cases, and five original/optimized/repeat/invalid-width/conditional image probes. Both control and candidate preview roots emit the existing configured `https://takonbini-web.vercel.app/` canonical and `noindex` response header. The initial verifier assumed production's `https://takonbini.com` canonical and failed; after confirming the same preview domain on both arms, the seven preview cases were checked against their actual configured domain. This is not a production SEO acceptance claim or a region-induced metadata change. Production's custom-domain checks from the approved #87 release remain retained separately.

No new user-reported acceptance or full interactive/device/accessibility coverage is asserted by these HTTP probes. Browser assets are byte-identical across the region arms; this task made no UI or locale implementation change.
