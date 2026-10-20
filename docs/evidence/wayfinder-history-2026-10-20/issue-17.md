## First-frame diagnosis complete; method adopted; cold catalog still open — 20 October 2026

The maintainer explicitly chose **“Adopt the documented applied-throttling method”** for #86's next release checks, retaining all original simulated failures and remaining cold-source/device limits. This supersedes the method-decision-pending status below; it is not merge approval or new UI acceptance. [PR #88](https://github.com/seancheong/takonbini-web/pull/88) remains OPEN/draft. Final head **b79d04e** passes [Web CI 39386239047](https://github.com/seancheong/takonbini-web/actions/runs/39386239047), Vercel and both Socket checks; product tests remain 144 passing. No merge or production release occurred.

- The 27-capture diagnosis isolates a launcher/browser contribution: live applied LCP median 2.543 → 1.115 s and script-free SSR 2.508 → 0.901 s with only configured RenderDocument changed. Minimal control stays ~0.63 s. Actual launch arguments/settings are retained. Hydration is not required for the reproduced delay; Chrome's exact internal cause and every prior slow run are not proved.
- A repeatable `scripts/measure-mobile.mjs` uses Chrome default features and applied mobile network/CPU throttling with a pinned external audit runtime; no product dependencies or audit workaround were added. The original simulated series is preserved, not erased or silently relabeled.
- **The agreed-method release run still fails one sample.** Measured b10a1f3 / preview 7193890015: catalog 2.772 / 1.367 / 1.282 s (MISS/HIT/HIT), heavy detail 1.452 / 1.231 / 1.316 s (HIT/HIT/HIT), light detail 1.140 / 1.124 / 1.190 s (MISS/HIT/HIT). All medians pass; eight of nine samples pass; CLS/TBT zero. The command correctly returns exit 1 for the first cold catalog. TBT is not INP and cache MISS is not full function/source-CDN/device coverage.
- The remaining cold catalog has ~1.312 s discovery delay, ~1.291 s load and only ~18 ms render delay. Next investigation is the SSR/data/image delivery waterfall, rather than attributing this failure to the earlier long post-download presentation interval. This is performance acceptance, not evidence of an urgent production outage; correctness checks remain passing.
- [Agreed method, exact deployment, every release sample and remaining limits](https://github.com/seancheong/takonbini-web/blob/b79d04e/docs/evidence/applied-mobile-2026-10-20.md); [full first-frame diagnosis](https://github.com/seancheong/takonbini-web/blob/b79d04e/docs/evidence/first-frame-2026-10-20.md). Regional response benefits and higher published Tokyo per-unit rates remain as recorded below.

**Next actionable task: continue #86 by diagnosing/reducing the first catalog SSR/data/image discovery-and-load waterfall under the adopted method. Keep #88 draft and #86 open.** Original failures, remaining cold-source/INP/device/accessibility/resource-cost/global/observation gates stay explicit. #17/#26/#27/#29 remain open; map #5/#36 historical closed states stay closed. Production remains approved #87 / 0b6d03d. #24 still has one evidenced new-configuration scheduled success; next nominal opportunity is 21 October 02:00 Malaysia time, subject to GitHub delay, with recovery/alert/cost gates open. #23's stable 30-day window has not started.

---

## Regional experiment measured; PR #88 remains draft — 20 October 2026

[Draft PR #88](https://github.com/seancheong/takonbini-web/pull/88) compares the merged #87 application in explicit Washington (`iad1`) and Tokyo (`hnd1`) function regions. Control **3cbd3d0**, deployment **7188342388**, and candidate **5775679**, deployment **7188355717**, pass CI/Vercel; candidate Socket checks also pass. Final evidence-only head **d25c826** also passes [Web CI 39370926695](https://github.com/seancheong/takonbini-web/actions/runs/39370926695), Vercel and both Socket checks. Local 144 tests, types, lint and build pass; all static asset hashes are identical. Actual no-store responses verify `sin1::iad1` versus `sin1::hnd1`. **No merge or production deployment occurred; production stays on approved #87 / 0b6d03d.**

- Eight image pairs actually observed as MISS/MISS are all faster in Tokyo: median total HTTP **673.5 → 297.8 ms**. All twelve first-request pairs, including four with unmatched/HIT states, remain recorded. Every repeated request is HIT; repeat medians **106.0 → 106.6 ms**. All corresponding WebP bytes/ETags match. Six alternating route-response pairs give catalog **822.1 → 407.8 ms**, detail **543.0 → 323.5 ms**. Network, function-instance and upstream cache state remain uncontrolled; these are not global-user or billing claims.
- **Overall mobile acceptance still fails.** Eighteen sequential fresh-profile standard Lighthouse runs, three per case/arm: US/Tokyo median LCP catalog **1.743 / 2.202 s**, heavy detail **2.143 / 1.235 s**, light detail **2.144 / 2.730 s**. Tokyo light-detail median fails 2.5 s; catalog median is slower than control. CLS zero throughout, TBT 0–28 ms is not INP. Every slow run remains included; no universal regional LCP improvement is asserted.
- One failing Tokyo HIT trace has its image loaded around 321 ms, PaintImage around 347 ms, but first presentation around 1,354 ms without a recorded >50 ms main-thread task in the interval. A separate six-run RenderDocument launcher diagnostic is consistent with a browser/launcher contribution, but is small, not a proved internal cause, not an app fix and **does not replace the standard acceptance series**. No audit-detection/browser workaround is added to the site.
- Tokyo continuity passes six sequential/twelve concurrent locales, seven SEO/responsive-image cases and five image-route probes. Both preview roots have the same existing configured vercel.app canonical and noindex header; the verifier's initial production-domain assumption was corrected and retained in the evidence. No new user acceptance or full interactive/device/accessibility matrix is claimed.
- Published Pro CPU/memory rates are higher in Tokyo; actual plan allowances, billed cost/resource use and global performance remain unaccepted. No plan upgrade, additional region/service, dependency, UI, image/cache/resource bound, API/storage/scheduler or product-data change is introduced.
- [Every sanitized sample, revisions/deployments, cache classifications, retained probe failures and limitations](https://github.com/seancheong/takonbini-web/blob/d25c826/docs/evidence/regional-latency-2026-10-20.md).

**Next actionable task: continue #86 with controlled stock-browser/applied-throttling and trace validation of the remaining first-frame presentation delay. Keep #88 draft and #86 open; do not ask to merge this draft as if mobile acceptance passed.** Any acceptance-method replacement must be explicit; preserve original failures. Once release-ready, exact-PR merge approval and subsequent production verification remain required. #17/#26/#27/#29 remain open; historical map states #5/#36 stay closed. Parent INP/device/accessibility/observation and actual resource/cost gates remain. #24 retains one evidenced new-configuration scheduled success; next nominal opportunity is 21 October 02:00 Malaysia time, subject to GitHub delay, with recovery/alert/cost gates open. #23's stable 30-day window has not started.

---

## PR #87 merged and production-verified — 20 October 2026

The maintainer explicitly approved [PR #87](https://github.com/seancheong/takonbini-web/pull/87). The checked head **ac64f76dcd7df5358a0c66b298b8ae769a96bdf1** merged as **0b6d03d45aec0eb16577e7220ad98c77364bd3cf** at 00:25:10 UTC. [Main Web CI 39347526577](https://github.com/seancheong/takonbini-web/actions/runs/39347526577) passed. Production deployment **7188295130** succeeded for that exact merge commit: [immutable deployment](https://takonbini-eepesuseg-sean-cheong-zhen-xiongs-projects.vercel.app). This supersedes the prior #87 ready-for-review / awaiting-approval checkpoint.

- Direct authenticated, validated server catalog/detail transport is released, removing the HTTP self-proxy hop. Browser requests retain the same-origin API proxy. All 144 tests and final PR checks passed before the authorized merge; main CI passes afterward.
- Live https://takonbini.com verification passes: seven catalog/detail canonical/Open Graph/responsive-image cases; six sequential and twelve concurrent locale-precedence cases with matching document language and heading; five original/optimized/repeat/invalid-width/conditional-image probes. The exact immutable merge deployment also serves the expected server-rendered detail with its responsive eager image. These are read-only agent release checks, not new user-reported acceptance.
- [Retained implementation, controlled compiled-harness and preview measurements](https://github.com/seancheong/takonbini-web/blob/0b6d03d45aec0eb16577e7220ad98c77364bd3cf/docs/evidence/direct-catalog-2026-10-20.md). The frozen document describes the pre-merge preview checkpoint; this entry records the subsequent approved merge and production verification. No new production Lighthouse series was run in this merge step; do not relabel preview metrics as production measurements.
- **#86 remains open:** preview cold-image failures (catalog 3.229 s; light detail 2.520 s), broader controlled route-response/native-resource/cost acceptance, and parent INP/device/accessibility/observation gates remain. Prior production #85 and #87 preview results remain historical evidence. No image-region/cache/resource configuration, dependencies, API/storage/scheduler or catalog data changed in this release.

**Next independent task: continue #86 with a controlled function-region/cold-image latency experiment.** The observed Singapore-edge/US-function path is a hypothesis to test, not a proved cause or a released region change. Canonical #17 and acceptance parents #26/#27/#29 stay open; map issues #5/#36 retain their historical closed state. #24 still has one evidenced scheduled success on the new configuration; next nominal opportunity is 21 October 02:00 Malaysia time, subject to actual GitHub delay, with recovery/alert/cost gates open. #23's stable 30-day window has not started.

---

## Direct SSR transport ready for review; cold-source gate remains open — 20 October 2026

[PR #87](https://github.com/seancheong/takonbini-web/pull/87) removes the server render's HTTP hop through this site's own API proxy. SSR calls the existing authenticated and validated catalog source directly; browsers retain the same-origin proxy. Implementation **75a7d6d476b43688f54dc96da478aabf89600ac4** is measured on [preview deployment 7188168928](https://vercel.com/sean-cheong-zhen-xiongs-projects/takonbini-web/2ZEycwqrJXFHPVaXibBAniFH2YqE); **ac64f76** adds evidence only. PR #87 is OPEN and ready for review, not merged or production-deployed. Explicit approval for that exact PR is still required.

- All 144 tests, TypeScript, scoped lint and local production build pass. Implementation-head Web CI, Vercel and both Socket checks pass; final evidence-head ac64f76 Web CI [39347055230](https://github.com/seancheong/takonbini-web/actions/runs/39347055230), Vercel and both Socket checks also pass. No upstream credential identifiers occur in browser assets. Hydrated browser pagination increases 20 → 40 products and the product dialog loads without captured warnings/errors.
- A regression fails with two HTTP requests on unchanged main and passes with one direct upstream request. Actual compiled fixed-fixture SSR medians are about 85 → 31 ms with an explicitly injected 50 ms self-proxy delay. This isolates the removed hop, not real Vercel speedup. JS gzip −30 B; CSS unchanged. No image/cache/resource settings, dependencies, API/storage/scheduler or product data changed.
- Nine sequential fresh-profile preview Lighthouse performance runs: catalog median **100 / 1.446 s LCP**, heavy detail **97 / 2.137 s**, light detail **100 / 1.261 s**; CLS zero, TBT 0–3 ms. **Cold failures remain included:** first catalog 85 / 3.229 s and first light detail 97 / 2.520 s, both image MISS followed by HIT/HIT. Heavy detail is HIT/HIT/HIT because its URL was already requested by catalog. These are lab navigation measurements, not INP/field/full-device/accessibility/user acceptance.
- Six alternating-order hosted HTTP pairs: catalog medians 1108.4 → 847.9 ms; detail 554.0 → 558.6 ms (+0.8%). Network/upstream/instance/cache states remain uncontrolled, so this does not clear the earlier broader response-regression/cost gate. Local source-download versus Sharp-processing samples are separately recorded without implying Vercel CPU/billing acceptance.
- Cold image response headers took about 1.06 s and report a `sin1::iad1` path. A controlled function-region/cold-image comparison is the next independent diagnostic experiment; geographic latency is a hypothesis, not a proved root cause or a released configuration change.
- [Implementation, exact deployments, every sanitized sample and method limitations](https://github.com/seancheong/takonbini-web/blob/ac64f76/docs/evidence/direct-catalog-2026-10-20.md). Production remains the approved, deployed #85 revision c9db64b with its retained live evidence below.

**Next release action: review PR #87, obtain exact-PR merge approval, then verify production after an approved merge. Next independent implementation task: #86's controlled function-region/cold-image latency experiment. #86 and #17/#26/#27/#29 remain open; map issues #5/#36 keep their historical closed state.** Cold-source, broader controlled response/cost, INP/device/accessibility and observation gates remain. #24 retains one evidenced new-configuration scheduled success; next nominal opportunity is 21 October 02:00 Malaysia time, subject to GitHub delay, with recovery/alert/cost gates open. #23's stable 30-day window has not started. No new user-reported acceptance is asserted.

---

## PR #85 merged, deployed and production-measured — 20 October 2026

The maintainer explicitly approved merging [PR #85](https://github.com/seancheong/takonbini-web/pull/85). It merged as **c9db64b5b61a383c8dfeff43bee6cbcbc1736d9e**. [Main Web CI](https://github.com/seancheong/takonbini-web/actions/runs/39344992908) passed and [production deployment 7187935670](https://vercel.com/sean-cheong-zhen-xiongs-projects/takonbini-web/Fh8YrLn4Mjwe5yoCR1AxQRz721iK) succeeded for that exact commit. This supersedes the earlier ready-for-review / unmerged status.

- Bounded responsive WebP delivery and the native-paint correction are released. Live original JPEG returns 200 / image/jpeg / 622,842 B; optimized 640px WebP returns 200 / image/webp / 26,540 B, repeat edge HIT and conditional 304. Unsupported width returns 400 / no-store.
- Nine sequential fresh-profile production Lighthouse runs, three per case, on https://takonbini.com: heavy catalog median **97 / 2.128 s LCP / 497,142 B**; heavy detail **98 / 2.120 s / 274,951 B**; light detail **98 / 2.126 s / 268,339 B**. TBT and CLS are zero in every run. Current production median score/LCP/CLS targets pass.
- **Cold-source acceptance remains open.** Catalog runs are 91 / 3.105 s, 97 / 2.128 s, and 97 / 2.126 s; the actual LCP image has MISS/HIT/HIT while browser disk cache is false. No run is excluded. The first navigation still misses 2.5 s. Browser-cold and edge/upstream-cold are distinct; this does not clear all cache/device/error conditions or the earlier unisolated response-timing difference.
- Lighthouse 13.4.1, supported Node 24.16, Headless Chrome 155, identical recorded mobile 412×823 / DPR 1.75 / 150 ms RTT / 1638.4 Kbps / CPU 4×. Only performance category selected. This is navigation lab evidence, not INP, other Lighthouse categories, field Core Web Vitals, a full accessibility/browser matrix or observation acceptance. Raw reports and sanitized per-run JSON remain local.
- Seven production HTML cases retain exactly one correct product-path/root canonical and Open Graph URL, responsive srcset and intended eager/high-priority primary image. Six sequential and twelve concurrent locale-precedence checks pass with matching document language and heading. A scoped live browser check confirms a loaded visible image (opacity 1), cleared loading copy, correct product metadata after hydration and no captured warnings/errors. It is agent verification, not new maintainer-reported UI acceptance.
- All 139 tests and PR checks passed before merge; main CI passes afterward. The full dependency audit recorded zero findings before merge on the unchanged graph. Native processor resource/cache bounds remain as documented; actual billed CPU/memory/costs and controlled response timing are not accepted by these probes.
- [Merged implementation and retained pre-release proof/measurements](https://github.com/seancheong/takonbini-web/blob/c9db64b5b61a383c8dfeff43bee6cbcbc1736d9e/docs/evidence/native-image-paint-2026-10-20.md). That frozen document records the earlier preview decision; this checkpoint records the subsequent authorized merge, deployment and live measurements.

**Next actionable task: continue #86's remaining cold-source/first-navigation latency and controlled response-timing acceptance. #86 stays open.** The scoped implementation, merge, deployment and production median measurements are complete; broader #27/#29/#26 INP/accessibility/device/cache/error/observation gates remain. #24 still has one evidenced new-configuration scheduled success; next nominal opportunity is 21 October 02:00 Malaysia time, subject to GitHub delay, with recovery/alert/cost gates open. No scraper/API/storage/scheduler or catalog data changes occurred in this release. #23's stable 30-day window has not started.

---

## Native image paint and median performance gate — 20 October 2026

[PR #85](https://github.com/seancheong/takonbini-web/pull/85) now fixes the proved hydration paint blocker as well as bounded responsive image delivery. It advances to **ready for review**, not merged or production-deployed. This supersedes the earlier draft decision because the scoped implementation and current median lab targets now pass; it does not close remaining acceptance gates.

- Actual compiled SSR page with application scripts disabled: control image is downloaded but opacity 0; candidate is downloaded, opacity 1 and visibly painted. Card/detail photos now paint natively above the loading label. Loading/error handlers, badges, Safari feedback, geometry and navigation remain. Alpha transforms use the existing white canvas; original-byte URLs are retained.
- 139 tests, TypeScript/lint, local build and implementation/final evidence-head Web CI/Vercel/Socket checks pass. Full dependency audit records zero findings at this checkpoint. Synthetic alpha regression failed before the change; compiled-browser paint probe goes red → green. Scoped hosted mobile detail/loading cleanup, catalog/modal navigation and focus return pass.
- Three-run medians: heavy catalog control **96 / 2.728 s LCP** → candidate **97 / 2.145 s**; heavy detail **97 / 2.581 s** → **97 / 2.131 s**. Candidate light-detail continuity is **100 / 1.237 s**. CLS is zero in every run. All candidate median score/LCP/CLS targets pass under the existing navigation lab method; this is not INP, field or full Lighthouse/device/accessibility/production acceptance.
- **Slow cases remain included and open:** first heavy catalog is 87 / 3.212 s; first light detail is 96 / 2.696 s. Their actual image cache sequence is MISS/HIT/HIT with fresh browser profiles. Cold-source/first-navigation delivery is not universally within 2.5 s. Hosts/upstream/network variation prevents attributing the whole paired timing change solely to code.
- JS gzip is +223 B (0.12%) versus original main, CSS −7 B. Opaque transformed bytes/ETag are identical across arms. A small remote HTTP probe has catalog medians 709.4 / 856.9 ms (+20.8%); network/server/upstream effects are not isolated, and the controlled response-regression gate remains open. Actual native CPU/memory/billing and broader cache conditions remain unaccepted.
- [Exact revisions/deployments, every sample, real cache state, browser proof and limitations](https://github.com/seancheong/takonbini-web/blob/e0e1d0d/docs/evidence/native-image-paint-2026-10-20.md). Measured implementation is fdac37c; final evidence head is e0e1d0d.

**Next release action: review PR #85 and obtain explicit approval for that exact PR before merge; verify production after an approved release. #86 stays open for release evidence plus cold-source and controlled-response acceptance.** Independent remaining performance work is those #86 cold-source/response gates, with broader INP/accessibility/device/observation under #27/#29/#26. No scraper/API/storage/schedule change occurred. #24 retains one evidenced new-configuration scheduled success, with the next nominal opportunity 21 October 02:00 Malaysia time and remaining delay/recovery/alert/cost gates open. #23's stable 30-day window has not started.

---

## Responsive image implementation and measured preview — 20 October 2026

[Draft PR #85](https://github.com/seancheong/takonbini-web/pull/85) now implements #86's bounded responsive image delivery as well as first-card priority. **Implementation is tested in preview; performance acceptance is incomplete. No merge or production deployment occurred.**

- Server-only Sharp emits finite WebP sizes without cropping/enlargement. The full enumerated catalog's four exact HTTPS source hosts are covered. Redirect, size/decode, timeout and per-instance admission bounds are tested. Original raster bytes remain available, including the observed octet-stream JPEG correction.
- 136 tests, TypeScript/lint and local production build pass. Implementation and final evidence head 2250366 both pass Linux Web CI, Vercel preview and both Socket checks. PR #85 is confirmed OPEN and draft at that exact head. Hosted original/optimized responses, CDN HITs, ETag 304 and invalid-option no-store errors are verified; mobile catalog/modal and desktop detail images load.
- Heavy source 622,842 B → 26,540 B at 640px / 46,012 B at 960px. Client JS gzip +266 B (0.14%); CSS unchanged. Native server footprint and cold processing cost increase; actual billing and isolated response-regression acceptance remain unmeasured.
- Twelve sequential fresh-profile mobile samples, three per scenario: heavy catalog **94 / 2.730 s LCP**, heavy detail **96 / 2.708 s**, filtered light catalog **100 / 1.227 s**, light detail **97 / 2.489 s**; CLS zero throughout. Heavy cases still fail ≤2.5 s. Filtered light catalog's LCP is its heading; caches/hosts/timing differ from prior samples. Do not infer isolated causality, INP, full Lighthouse/device/accessibility or production acceptance.
- [Frozen measurements, exact implementation/deployments, quality checks, resource/cache contract and retained failure/correction](https://github.com/seancheong/takonbini-web/blob/2250366/docs/evidence/responsive-images-2026-10-20.md). The evidence distinguishes the measured transform revision from the later original-MIME correction.

**Next actionable work: continue #86 by diagnosing and reducing the remaining heavy catalog/detail discovery/paint delay, preserving loading/error behavior, then repeat the failed LCP cases. Keep #85 draft and #86 open.** Explicit exact-PR approval is required before merge; production verification follows release. #24's latest audit has one successful scheduled cycle on the released configuration; next nominal opportunity remains 21 October 02:00 Malaysia time, with actual delays and recovery/alert/cost gates still open. #23's stable 30-day window has not started.

---

## Scheduled production verification — 20 October 2026

The first unattended scheduled three-store cycle on the released reliability/security configuration completed successfully, attempt 1. Raw logs, private run identifiers and product records remain private.

- Nominal start: 20 October 02:00 Malaysia time. Actual creation: 06:12:26; job start: 06:12:29; completion: 07:16:41. Schedule delay: **4 h 12 m 26 s**. Job duration: **64 m 12 s**. Delay remains a freshness concern.
- Lawson 783, FamilyMart 1,761, 7-Eleven 2,198. MongoDB verification passed for **4,742 unique discovered IDs**, translated flag, nonempty English/Chinese titles, and expiry at least 13 days beyond verifier start. Description completeness, translation quality, retailer freshness and the historical 28-day lifecycle are not established.
- Prior older-configuration success verified 4,609 products (762 / 1,735 / 2,112). Current count +133 (+2.89%); additions/removals are not explained by aggregate logs. Do not count the older configuration as a second accepted cycle.
- Inspected production workflow history shows no overlapping listed production job. This schedule-triggered run is attempt 1 without a rerun shown; out-of-band database intervention is not independently audited. No manual run, schedule change, failure injection or catalog write was performed during this audit.
- Runner endpoint reports 3,856,000 ms workflow duration and zero billable Ubuntu milliseconds. OpenAI/MongoDB costs, quotas and resource movement remain unmeasured. Incremental-write recovery limits and the earlier maintainer-reported notification receipt remain; alert latency is unverified.

**#24 remains open: one new-configuration scheduled success is evidenced. Two consecutive cycles and remaining acceptance gates are incomplete. Next nominal opportunity: 21 October 2026 at 02:00 Malaysia time, subject to GitHub delay.** Preserve Tuesday/Wednesday/Thursday cadence. #23's stable 30-day window has not started. **Next actionable web task remains #86**, bounded responsive image delivery; PR #85 stays draft, unmerged and not production-deployed.

---

## Mobile performance follow-up — 20 October 2026

The mobile measurement task is complete; **performance acceptance is not**. [Draft PR #85](https://github.com/seancheong/takonbini-web/pull/85) retains the first-image priority change and all measured evidence. It is deliberately draft because the substantive image-payload gate still fails. No merge or production deployment occurred.

- Current-content production on unchanged web revision `a69d2829beccb27167d783f546cee32ccd21dd5b`: three browser-cold mobile navigation runs give median **74 performance, 6.77 s LCP, 0 ms TBT, 0 CLS**, about 1.57 MB transferred. The LCP image alone transfers roughly 593 KB. The original proxy forwards retailer image payloads without responsive resizing/compression.
- The earlier 19 October catalog baseline of 96 / 2.43 s used a different, lighter first product. It is historical evidence, not acceptance of the current catalog. The earlier sampled detail median 96 / 2.57 s also does not accept current heavy-image detail cases.
- Paired unchanged-preview/control versus candidate, three interleaved fresh profiles per arm: **76 / 6.13 s LCP** versus **78 / 5.34 s LCP**, CLS zero in both. The same LCP product ID appears across all six runs. The observed ~13% lower median is not isolated causal proof: hosts and CDN/upstream cache conditions differ and run variation is large. Both arms fail ≥90 performance and ≤2.5 s LCP.
- Lighthouse 13.4.1, supported Node 24.16, Headless Chrome 155, identical recorded simulated-mobile settings; only the performance category was selected. An unsupported-runtime bootstrap run is excluded. These are navigation lab samples, not INP, field Core Web Vitals, a real-device matrix, or full Lighthouse/accessibility acceptance. Zero TBT is not an INP result.
- All 110 tests, TypeScript, lint/build, Web CI, Vercel, and both Socket checks pass for the draft. The regression failed before implementation and passes afterward. JavaScript gzip increases 18 bytes; CSS is unchanged. Passing software checks do not clear the measured product performance gate.
- [Implementation, per-run metrics, exact deployment/settings and limitations](https://github.com/seancheong/takonbini-web/blob/5b5a987/docs/evidence/mobile-performance-2026-10-19.md). Raw reports/traces remain local; public evidence contains measurements rather than raw retailer/page payloads.

**Next actionable web task: [#86 — bounded responsive image delivery to restore mobile LCP](https://github.com/seancheong/takonbini-web/issues/86).** Address representative catalog/detail image payloads, resource/source/cache bounds and quality, then repeat mobile acceptance before advancing draft #85. INP interactions, other Lighthouse categories, detail headroom, cache/error/locale/device conditions, controlled response timing, accessibility/browser coverage and observation remain open under #27/#29/#26. #24 still requires evidenced consecutive unattended three-store cycles on the released configuration; no new operational run audit was performed here and no schedule was changed. #23's stable 30-day window has not started.

---

## SEO merge and production verification — 19 October 2026

The maintainer explicitly approved merging [PR #84](https://github.com/seancheong/takonbini-web/pull/84). It merged as `a69d2829beccb27167d783f546cee32ccd21dd5b`; main Web CI passed, and production deployment `7173213574` succeeded for that exact commit.

- [x] Product canonical and Open Graph URL correction is production-verified. Seven live HTML probes pass: catalog plus two standalone products in en/ja/zh with query filters. Each has exactly one expected canonical and one Open Graph URL on `https://takonbini.com`, with the correct product path and no filter/locale query. [Sample product](https://takonbini.com/products/ab7bec709206a1324c96fea0c238b347?lang=en).
- [x] [Production sitemap](https://takonbini.com/sitemap.xml) returns HTTP 200 with 5,018 unique same-origin URLs and both sampled products included, beyond the old 5,001-URL ceiling. Tests cover traversal beyond page 50, deduplication, loops, budget expiry, URL-count bounds, and failed/misconfigured enumeration returning 503 rather than partial success. Live enumeration is not a transactional database snapshot or Search Console indexing measurement.
- [x] Six sequential and twelve concurrent production locale-precedence probes all pass after this release. All 109 tests, TypeScript, lint, builds, PR checks, preview checks, and main CI passed. Local browser checks also verified metadata after hydration and settled client navigation; a new production browser matrix is not inferred.
- [Merged implementation and retained pre-release evidence](https://github.com/seancheong/takonbini-web/blob/a69d2829beccb27167d783f546cee32ccd21dd5b/docs/evidence/catalog-seo-2026-10-19.md). This checkpoint records the subsequent explicit merge approval, exact production deployment, and live checks. The earlier preview used its configured Vercel site origin; production custom-domain behavior is now separately verified. No ranking or search-engine-selected canonical claim is made.

**The scoped SEO correction is merged, deployed, and measured.** Keep #26/#29/#27 open for their remaining browser/assistive-technology, contrast/preferences, error/cache/performance and observation/recovery acceptance; later releases do not reconstruct the original isolated release windows. No scraper, storage, credential, scheduler, or production catalog data change was made.

**Next operational task remains #24:** two consecutive unattended three-store refresh cycles on the released configuration, next nominal start 20 October 2026 at 02:00 Malaysia time. Preserve Tuesday/Wednesday/Thursday 02:00 scheduling and measure actual delay, freshness/translations, bounded recovery, alert timing, and cost/resource movement. **Next actionable web work while waiting:** the remaining measured browser/accessibility and performance acceptance under #27/#29 (with shared #26 obligations). PR #84 no longer awaits review/merge. #23's stable 30-day window has not started by this release.

---

## SEO implementation and preview acceptance — 19 October 2026

[PR #84](https://github.com/seancheong/takonbini-web/pull/84) implements product-path canonical/Open Graph URLs and bounded, complete sitemap enumeration. The server-resolved site origin is serialized through root loader data for hydration. Enumeration follows beyond 50 pages, deduplicates IDs, detects cursor loops, and returns retryable HTTP 503 for incomplete/failed enumeration instead of a partial sitemap. The single-file URL/size limits and a 45-second fetch budget remain explicit bounds.

- All 109 tests, TypeScript, lint/scoped formatting, and production builds pass. Nine targeted tests failed before implementation. Prior characterization expectations for partial HTTP 200 behavior were deliberately replaced with the 503 contract.
- Actual local and hosted-preview HTML: seven SEO probes pass across catalog and two standalone products in en/ja/zh; each document has one expected canonical and Open Graph URL. Local browser DOM checks pass after hydration and settled navigation back to the catalog.
- Local and hosted-preview sitemaps return HTTP 200 with 5,018 unique URLs and both sampled products included, exceeding the old 5,001-URL ceiling. This is a current traversal, not a transactionally consistent database snapshot or a historical omission count.
- Hosted preview's six sequential and twelve concurrent locale-precedence probes all pass. Implementation-commit Web CI, Vercel, and both Socket checks passed. The evidence-only follow-up head also passed Web CI, Vercel, and both Socket checks.
- Preview uses its configured `https://takonbini-web.vercel.app` origin. An initial probe incorrectly expected the production custom host; the corrected configured-origin probe passed without code/config changes. Production `https://takonbini.com` metadata still requires release verification.
- [Implementation and retained evidence](https://github.com/seancheong/takonbini-web/blob/7597c51/docs/evidence/catalog-seo-2026-10-19.md). Preview measurements are attributed to the implementation commit and deployment recorded there. **Not merged or deployed to production.** Existing release-window sequencing gaps, accessibility/performance/SEO indexing/observation and recovery requirements are not closed by these checks. A future catalog beyond the single-file envelope needs a sitemap index rather than silent omission.

**Next actionable task: review PR #84 and obtain explicit approval for that PR's merge, then verify main CI and production SEO after release.** The operational queue still retains #24: collect two consecutive unattended three-store refresh cycles on the released configuration, with the next nominal opportunity on 20 October 2026 at 02:00 Malaysia time. Preserve the Tuesday/Wednesday/Thursday schedule. API deployment is already verified; no scraper, storage, credential, scheduler, or production data changes were made by this SEO task. #26/#29/#27 retain their other acceptance gates; #23's stable 30-day window has not started by this work.

---

## API deployment verified — 19 October 2026

The maintainer explicitly approved the separate deployment-waiter PR merge. Its checks passed and the merge is confirmed. The already-authorized API deployment was retried from merged main and completed successfully.

- The frozen-lockfile API build and Lambda code upload succeeded. The configuration-based waiter confirmed a successful Lambda update, and the workflow's authenticated production API check passed. Main Infrastructure CI passed for the merged workflow fix. The public catalog API proxy also returned HTTP 200 during this deployment session.
- The earlier attempt had successfully uploaded code but failed its GetFunction-based waiter and skipped production verification. The successful retry supersedes that incomplete deployment checkpoint; retain it as the reason for the one-line fix. No IAM/trust-policy change was made.
- API security implementation is now merged and the refreshed API artifact is deployed with the production response check passing. Full and production dependency audits recorded zero findings for the merged dependency graph, and the default-branch advisory query returned zero open alerts during this session. These are scoped measurements, not a guarantee against future findings or a full production/browser audit.
- Private review, commit, deployment-run, and check evidence remain linked in the private API review; private identifiers and logs are omitted here. No manual scraper run, scheduler change, or production catalog write was performed.

**Next task remains #24:** inspect the first scheduled three-store refresh on the released configuration after its nominal 20 October 2026 02:00 Malaysia-time start, then establish two consecutive qualifying unattended cycles. Preserve Tuesday/Wednesday/Thursday 02:00 scheduling and record actual delay, overlap/intervention, translations/freshness, bounded recovery, alert timing, and real cost/resource movement. Do not count an older configuration's success as acceptance of the current configuration. Product canonical/Open Graph URL and complete/truthful sitemap fixes remain actionable now under #26/#29/#27. Their remaining browser/SEO/recovery/observation gates stay open, and #23's stable 30-day window is not started by deployment alone.

---

## API deployment attempt — 19 October 2026

The maintainer authorized deployment of the merged security update. Main API CI and Scraper CI passed, and the current API default-branch dependency-alert query reports zero open alerts.

The production deployment built the frozen-lockfile artifact and **successfully uploaded the Lambda code**. It then failed at the update waiter because the deployed role denied the GetFunction API required by that waiter. The authenticated production API check was skipped. Therefore this is a successful code upload with **incomplete deployment verification**, not a fully accepted deployment or a proven failed Lambda update. Do not infer rollback or unchanged live code from the failed workflow conclusion.

A separate private one-line workflow PR switches to the configuration-based waiter, which checks the same successful update status through the API included in the declared role policy. No IAM/trust-policy change is proposed. Private review and failed-run evidence are retained in that PR. Its merge requires the maintainer's explicit approval for that PR; existing deployment authorization remains in effect for the subsequent retry.

**Next task: #24 — approve/merge the deployment waiter fix after checks, retry the authorized deployment, and verify the Lambda update plus authenticated production response.** Then preserve the existing Tuesday/Wednesday/Thursday 02:00 Malaysia-time schedule and collect two consecutive unattended three-store cycles on the released configuration, starting no earlier than the nominal 20 October 02:00 opportunity. Scheduler, production data, and IAM permissions were not changed by this attempt. Recovery limits, freshness/lifecycle differences, alert latency, measured costs, web canonical/sitemap fixes, and observation gates remain open. #23's stable 30-day window is not started here.

---

## API security merge checkpoint — 19 October 2026

The maintainer explicitly approved the separate private API security PR, and its merge is confirmed. Private implementation, merge, audit, and build evidence remain linked in that review; no private repository/run identifiers are published here.

- All PR checks passed before merge: API tests/build, scraper reliability/retry/lint/live three-store retailer smoke checks, and both Socket checks. Candidate full and production dependency audits reported zero findings, versus 27 and seven at baseline. The merged change removes the unused vulnerable dependency path and patches the affected tooling graph.
- **Merge complete; deployed API security acceptance remains open.** The API deployment workflow is manual and was not dispatched. Candidate audits and a merge do not prove the currently deployed Lambda has been replaced. Default-branch advisory reconciliation and main CI are separate measurements.
- The scheduled scraper consumes main, so its next production run uses the new dependency configuration unless main changes again. No manual refresh, scheduler change, production data write, or deployment was performed by this merge.

**Next task remains #24:** verify main API/Scraper CI and the applicable API deployment/security acceptance; inspect the next scheduled three-store refresh after its nominal 20 October 2026 02:00 Malaysia-time start, then prove two consecutive qualifying unattended cycles on the released configuration. Preserve Tuesday/Wednesday/Thursday 02:00 scheduling and account for actual start delays. Old-revision successes do not accept this configuration. Recovery limits, freshness/lifecycle differences, alert latency, measured costs, web canonical/sitemap fixes, and observation gates remain open. #23's stable 30-day window has not started by this merge.

---

## API security remediation prepared — 19 October 2026

The previously merged private reliability fix has now also passed main Scraper CI. A separate private API security pull request is prepared; implementation, audit snapshots, advisory references, and build assessment are linked in that private review. Private repository and run identifiers remain omitted here.

- Baseline workspace audit: 27 findings (one critical, 14 high, 10 moderate, two low). Production graph: seven (three high, three moderate, one low). These are dependency findings, not proof of deployed exploitability.
- Candidate full and production audits both report zero findings. The candidate removes an unused dependency path with unpatched findings and updates the affected test/build dependency families without changing application source or production scheduling.
- All 30 API tests and coverage tooling pass; the API bundle builds and its input assessment excludes the removed packages while retaining the intended SDK client. All nine scraper reliability tests, detail retries, scraper TypeScript, Biome, and a frozen-lockfile install pass locally.
- **Prepared, not merged or deployed.** Hosted API tests/build and scraper reliability/retry/lint/live three-store smoke validation all passed; both Socket checks passed. Default-branch alerts and deployed artifacts are not claimed remediated by a candidate audit. Existing overlapping dependency PRs remain open pending a merged-version comparison.

**Next task remains #24:** finish security PR validation and obtain explicit approval for that specific merge; verify main CI and the applicable API release afterward. Preserve Tuesday/Wednesday/Thursday 02:00 Malaysia-time refresh scheduling. A security merge changes the scheduled refresh dependency configuration, so verify two consecutive qualifying unattended three-store cycles on the released configuration; no old-revision success accepts the new configuration. Recovery limitations, freshness/lifecycle differences, alert latency, measured cost, web canonical/sitemap fixes, and observation gates remain open. #23's stable 30-day window is not started by this preparation.

---

## Reliability fix merged — 19 October 2026

The maintainer explicitly approved merging the private API reliability pull request, and the merge is confirmed. The private review retains the implementation/merge links and passing test evidence; private repository identifiers remain excluded here.

- PR checks passed before merge: all nine isolated persistence/translation regression tests, detail retries, lint, live three-store retailer smoke checks, and both Socket checks. Scraper TypeScript and repository Biome checks also passed locally.
- Database failures now propagate; translation reuse requires nonempty English and Chinese titles, and incomplete translated batches reject before their write. Earlier batches and partial unordered writes can still remain after a later failure. Atomic publication/rollback/resumability are not claimed.
- **Merge is complete; production refresh verification is not.** No manual refresh or scheduler change was performed. Scheduled production execution consumes main, so the next run will use the new revision unless main changes again. Do not count the previous revision's successful run as acceptance of this fix.
- **Next task: #24 — inspect the first post-merge scheduled three-store cycle after the nominal 20 October 2026 02:00 Malaysia-time start, then establish two consecutive qualifying unattended cycles on the released configuration.** Preserve Tuesday/Wednesday/Thursday 02:00 scheduling and account for observed start delays. Keep #24 open.
- Existing API dependency assessment/remediation remains an outstanding security gate, independently of passing PR checks. Freshness/lifecycle limits, bounded recovery, alert latency, cost/resource movement, and the remaining web/SEO/observation gates remain open. One actual failure-notification receipt is maintainer-reported evidence. No stable 30-day window is claimed for #23.

---

## Reliability fix prepared — 19 October 2026

A separate private API pull request now implements the bounded #24 persistence/translation fix. Private implementation and test evidence are linked in that review; private repository identifiers are omitted from this public record.

- Database read/write failures reject instead of being swallowed. Existing translation reuse requires nonempty English and Chinese titles; incomplete translated batches reject before persistence.
- Nine isolated regression tests pass; seven failed before the fix. Existing detail-retry tests, scraper TypeScript, and repository Biome checks pass locally. Tests use synthetic products and mocked external services, with no production writes or translation calls. PR CI passed, including the new failure tests, detail retries, lint, and live three-store retailer smoke checks; both Socket checks passed.
- **Recovery limit:** earlier batches and partially successful unordered database writes may remain after a later failure. This does not implement atomic publication, rollback, checkpointed resumability, description completeness, or a revised lifecycle policy.
- **Release state:** prepared for review; not merged or deployed. Keep the Tuesday/Wednesday/Thursday 02:00 Malaysia-time schedule unchanged. After a scraper revision change, verify two consecutive unattended three-store cycles on the released configuration; an older revision does not accept the fix.
- Existing API dependency findings were observed separately. The web audit's zero-finding snapshot is not API security clearance; applicable API security assessment/remediation remains a production release gate. Do not claim cost, observation, or remaining browser/SEO gates complete.

**Next task remains #24:** finish private PR validation/review and assess the API security gate before release, then collect new-revision scheduled-cycle evidence. Product canonical/Open Graph URLs and complete/truthful sitemap enumeration remain independently actionable under #26/#29/#27. Maintainer-reported receipt of one real failure notification remains recorded; alert latency and measured cost/resource movement remain open. #23's 30-day measurement window has not started by this change.

---

## Recovery, alerts, and web acceptance audit — 19 October 2026

- **#24 remains open.** Four isolated synthetic failure probes reproduced swallowed database read/write errors, reuse of a translation missing its Chinese title, and persistence of an earlier batch before a later failure. These are observed recovery limitations, not passing reliability gates. No production failure was injected and no scheduler or production data changed.
- The maintainer confirmed receipt of the real failed refresh's GitHub notification on 14 October Malaysia time. Record this as maintainer-reported receipt; latency, other recipients, and missing-run/freshness/cost alerts remain unverified. No retained diagnostics are currently listed for that failed run.
- The latest successful run reports 53m51s duration and zero billable Ubuntu milliseconds through GitHub's timing endpoint. This is not total-cost evidence: translation billing, MongoDB usage, quotas, and resource/cost movement remain unmeasured. Two consecutive qualifying scheduled cycles remain unproven.
- Read-only current-production checks: [robots](https://takonbini.com/robots.txt) permits crawling and advertises [the sitemap](https://takonbini.com/sitemap.xml). Homepage and two sampled detail responses returned HTTP 200 with requested English/Traditional Chinese document languages and populated generic metadata. **Both sampled product pages incorrectly declare the homepage canonical.** The sitemap has 5,001 unique URLs, matching the homepage plus the implementation's 5,000-product cap. Actual omissions are not proven; completeness remains unproven because the route ignores incomplete enumeration. HTTP samples do not establish controlled performance, hydration, browser/assistive-technology, or observation acceptance.

**Next work: #24 recovery/translation failure handling and bounded recovery acceptance can proceed now; inspect the next scheduled cycle after its nominal 20 October 02:00 Malaysia-time start.** Preserve the schedule. Any scraper revision change requires reassessing qualifying cycles. In parallel, #26/#29/#27 need product canonical/Open Graph URL correction and complete/truthful sitemap enumeration with regression and preview verification. Their remaining acceptance gates stay open; this audit does not reconstruct historical release windows or start #23's measured 30-day window.

---

## Operational evidence audit — 19 October 2026

Work on #24 has started. The production schedule and run history were inspected again; no newer production cycle exists. Daily Scraper CI successes are smoke checks and do not count toward this acceptance gate.

- The latest production cycle succeeded unattended on the current scraper revision (attempt 1); the immediately preceding scheduled production cycle failed after FamilyMart detail retries. Two consecutive qualifying successes remain unproven.
- The successful cycle's MongoDB verifier checked all discovered unique product IDs, nonempty English and Chinese titles, the translated flag, and expiry at least 13 days beyond run start. All three stores returned nonzero results. This does not prove description completeness, translation quality, or the historical 28-day lifecycle contract.
- The successful cycle began approximately 3 hours 29 minutes after its nominal schedule and took approximately 54 minutes. Schedule delay must remain visible in freshness acceptance.
- The deployed workflow retains Tuesday/Wednesday/Thursday 02:00 Malaysia time, a single concurrency group with cancel-in-progress disabled, and a 300-minute timeout. These settings alone do not prove recovery, atomic publication, or alert delivery. Failure diagnostics are configured with seven-day retention; no alert-delivery drill or billing/resource evidence was collected in this audit.
- Raw logs, product-level datasets, private repository/run identifiers, and credentials remain private. No scheduler, production data, or scraper code was changed and no manual production run was dispatched.

**Next action: #24 — inspect the next scheduled production cycle (nominally 20 October 2026 at 02:00 Malaysia time), then verify consecutive three-store success, overlap/manual-intervention history, freshness/translation limits, bounded recovery, alert delivery, and actual cost/resource movement.** Actual schedule execution can be delayed. Keep #24 open until all exit gates have evidence; continue web acceptance work while awaiting that cycle. This audit does not begin or complete #23's 30-day measurement window.

---

## Security completion checkpoint — 19 October 2026

- PR #83 merged as `bf5d51f515e292d40ec0935726b51773435f4e4e` with explicit maintainer approval. Main Web CI passed and production deployment `7171922928` succeeded for that commit.
- Production and full dependency audits report zero vulnerabilities at the recorded check. All 101 tests, TypeScript, build, and CI pass; both Socket checks pass. The hosted preview passed six sequential and twelve concurrent locale probes and sampled catalog/detail/Escape navigation checks.
- The maintainer confirmed in chat that the production smoke checks are complete. This is maintainer-reported production acceptance; no additional browser/device, accessibility, performance, or automated production-probe results are inferred from that confirmation.
- [Merged remediation, resolved graph, artifact assessment, and verification evidence](https://github.com/seancheong/takonbini-web/blob/bf5d51f515e292d40ec0935726b51773435f4e4e/docs/evidence/dependency-security-2026-10-19.md). This issue records the subsequent production deployment and maintainer confirmation.
- #82 is complete. PRs #64–#69 are now closed; their dependency fixes were included at equal or newer versions in #83. The earlier advisory counts remain historical baseline evidence, not current unresolved findings.
- **Next task: #24 — verify two consecutive unattended MongoDB three-store refresh cycles and their freshness, translation, recovery, alerting, and cost evidence.** The previously inspected history established only one qualifying success on the current scraper revision; no newer operational run evidence was collected during this security task. Keep the configured Tuesday/Wednesday/Thursday 02:00 Malaysia-time schedule unchanged.

MongoDB-only application storage remains the current decision. #26/#29, #27/#16/#74, and #23 retain their remaining acceptance/evidence gates; completion of #82 does not close them.

---

## Outcome

Deliver a reliable, maintainable, localized Takonbini catalog through independently verifiable releases and linked production evidence.

## Current architecture decision — 18 October 2026

The maintainer confirmed MongoDB-only application storage and refresh persistence. The DynamoDB migration in #36/#41 and rollout #51–#59 is superseded. #51 remains a historical completed experiment; #52–#59 are canceled, not completed. Do not recreate application DynamoDB tables, switch API reads to DynamoDB, or retire MongoDB. Terraform backend locking is outside this application-storage decision.

The earlier Wayfinder specifications remain historical references where they describe abandoned storage, publication, scheduling, or retirement paths. Preserve their useful intent only where it matches the current MongoDB implementation; do not claim old generation/lease/recovery guarantees without new implementation evidence.

## Current checkpoint — 19 October 2026

- #80 merged: per-request SSR translation isolation; 101 local tests passed. The post-merge production probe passed six sequential and twelve concurrent URL/cookie/header precedence checks, and all 18 checks passed again during this reconciliation.
- #81 merged into main `a2c84b78198dadb99b105e3975e7f7c6a0b4b7ca`; main Web CI passed. **Production fix verified on 19 October 2026.** Successful production deployment `7171367908` uses PR head `10fef2274f31ba71ec46275359ca9f13f28bbfd6`, whose Git tree exactly matches the merged main commit. The live document links `/manifest.json`; the manifest and all three referenced icons return HTTP 200. The maintainer also confirmed the manifest error is gone. All six sequential and twelve concurrent locale-precedence probes pass after this deployment.
- The maintainer reported the supplied manual checklist passed: filters/pagination and retained return state, direct detail links, keyboard/dialog focus, responsive locale/theme layouts, and reduced motion. Exact browser/device versions and VoiceOver/contrast/reduced-transparency results were not supplied; do not claim a full accessibility or browser-matrix audit.
- [Merged verification and dependency assessment](https://github.com/seancheong/takonbini-web/blob/a2c84b78198dadb99b105e3975e7f7c6a0b4b7ca/docs/evidence/current-release-2026-10-19.md). This records the limits of the measurements as well as the passing checks.
- #82 dependency remediation is complete through merged PR #83. Production and full audits report zero vulnerabilities at the recorded check; see the security completion checkpoint above for release evidence and maintainer-reported production smoke checks.

## Reconciled work queue

1. **#24 — MongoDB refresh reliability evidence (next task).** The current Tuesday/Wednesday/Thursday 02:00 Malaysia-time GitHub production workflow is already configured. Latest inspected schedule history remains success/failure/success, with only one successful scheduled cycle on the current scraper revision. Collect the second qualifying cycle and freshness, translation, recovery, alerting, delay, and cost evidence; daily smoke CI is separate.
2. **#26 / #29 — Products-module and StyleX release acceptance.** Implementation is already merged. Record remaining production/runtime/performance/SEO checks, recovery acceptance, and observation. Later releases do not reconstruct the original isolated release windows.
3. **#27 / #16 / #74 — Catalog, localization, and motion acceptance.** Record the passing manual checklist and production locale probe already collected; do not repeat implemented code or completed checks as upcoming work. Remaining gaps include specifically recorded browser/assistive-technology coverage, contrast/reduced transparency, missing-translation and slow/error/cached-versus-uncached cases, performance/SEO/sitemap completeness, and observation. Preserve the current approved masthead, explicit-submit search, Load more pagination, and route-backed modal.
4. **#23 — Final evidence package.** Start the measured 30-day cost/stability window only once the final configuration is stable and record its actual start/configuration. No completed window is claimed.


Verification/evidence work and targeted web fixes can proceed without reviving the abandoned migration. Scraper changes and web releases retain separate review and production change windows. The list records remaining obligations, not an assertion that previously shipped work met its original sequencing gates.

## Rules

- Security remediation remains a hard gate; inspect current findings rather than assuming old acceptance covers new dependencies.
- Every phase needs linked implementation and acceptance evidence before closure. Merged code and elapsed time alone do not prove production acceptance.
- Do not publish reliability, accessibility, performance, freshness, or cost claims without the relevant measurements.
- Keep credentials, private repository details, database identifiers, retailer datasets, and unpublished operational evidence out of public tickets.
- Destructive operations and merging individual pull requests require their applicable explicit authorization.

## Decision history

Original planning: #5. Abandoned DynamoDB planning: #36 and #41. Their current-decision banners supersede their historical rollout instructions. Web architecture, styling, and localization decisions remain useful where consistent with the current approved implementation.

## Completion

Applicable implementation tickets have linked acceptance evidence, two unattended MongoDB refresh cycles are verified, hard web gates pass, and the final 30-day evidence window is complete.

## Latest code reconciliation

Main includes #80/#81/#83. Dependency remediation and its release smoke checks are complete, with production smoke checks attributed to the maintainer. #24 is the next task; the remaining web acceptance and final evidence gates stay open. Repository-wide alert counts and future advisories must be assessed separately from the recorded zero-finding audit snapshot.
