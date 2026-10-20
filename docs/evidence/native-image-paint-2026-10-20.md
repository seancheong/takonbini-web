# Native product image paint — 20 October 2026

Continuation of #86 and PR #85. No merge or production deployment.

## Reproduction and mechanism

Control: 2250366, preview deployment 7187639848. Its image pipeline reduced payloads, but heavy catalog/detail medians still exceeded 2.5 s LCP. To isolate paint from network timing, a local HTTP fixture serves the actual rendered heavy-detail HTML/CSS with CSP script-src 'none'. All page application scripts are disabled while native CSS/image loading stays active.

Read-only browser probe on the actual image: complete && naturalWidth > 0, getComputedStyle(img).opacity, and screenshot. Control repeatedly returns downloaded=true, opacity=0, visibleBeforeHydration=false. The photo stays invisible even after its complete image transfer, with the loading label in its place. This is a deterministic reproduced defect; an opacity dependency on hydration is proved independently of noisy Lighthouse timing.

Ranked hypotheses recorded before the fix: (1) hydration-gated opacity, (2) JS download/hydration critical path, (3) server/product delay before image discovery. Only the first is isolated by this probe. Other contributions are not assumed absent.

## Implementation

- Remove loaded-state opacity from card and detail images. Native decoded pixels paint immediately.
- Position the image above its preceding loading label without introducing a z-index above the subsequent release badges or Safari navigation overlay. Detail keeps its absolute canvas geometry.
- Retain React load/error handlers and loading/missing/error feedback. The browser covers the label with decoded pixels before hydration; hydration then removes the label from the DOM. Without JS the covered loading text remains in the accessibility tree; this is not a fully scripted/accessibility-equivalent page.
- Composite transformed alpha sources onto the existing white product canvas so a decoded transparent image cannot reveal the loading label. Original-byte passthrough remains untouched. A synthetic transparent-PNG regression fails before the change and passes afterward (opaque white WebP output).
- Preserve aspect ratios, sizes/srcsets, priorities, view-transition identities, locale/theme ownership, navigation and source/resource/cache bounds.

The identical candidate no-hydration probe returns downloaded=true, opacity=1, visibleBeforeHydration=true; the screenshot shows the product photo instead of the loading label. The local compiled production build is used, not hand-written replacement markup. Unit tests preserve card/detail load feedback and unavailable fallback. The actual paint behavior needs the compiled browser probe; a JSDOM class assertion would not test CSS stacking or native image paint.

## Verification and review readiness

Implementation fdac37c27dc7ebf59d34f5616a3427fa763521fc, [preview deployment 7187732452](https://takonbini-mmcp93vrs-sean-cheong-zhen-xiongs-projects.vercel.app). Control 2250366b263e87620dbf944dd4f6f9245a041af2, deployment 7187639848. 139 tests, TypeScript, lint, local production build and implementation-head Linux Web CI/Vercel/Socket checks pass.

Twelve sequential interleaved mobile runs, three per arm/scenario, followed by three candidate light-detail runs: Lighthouse 13.4.1 / supported Node 24.16 / Headless Chrome 155, 412×823, DPR 1.75, simulated 150 ms RTT / 1638.4 Kbps / CPU 4×. Only performance category selected; each navigation uses a fresh profile. No other build, audit or browser interaction runs alongside an audit. Browser cache is cold; edge/upstream state is observed rather than forced.

| Three-run median | Control score / LCP | Candidate score / LCP | Candidate CLS |
| --- | ---: | ---: | ---: |
| Heavy catalog | 96 / 2.728 s | 97 / 2.145 s | 0 |
| Heavy detail | 97 / 2.581 s | 97 / 2.131 s | 0 |
| Light detail continuity | Earlier checkpoint 97 / 2.489 s | 100 / 1.237 s | 0 |

All current candidate medians pass the existing navigation lab score/LCP/CLS targets. The deterministic browser probe proves removal of the hydration paint dependency. The paired medians alone do not isolate causal effect: preview hosts, network/upstream conditions and scheduling vary. Do not treat this as field/INP, other Lighthouse categories, a real-device/accessibility matrix, or production acceptance. Catalog TBT median is 1.5 ms; detail/light medians are zero; TBT is not INP.

**Cold-source limitations remain open.** Candidate heavy-catalog LCP runs are 3.212 / 2.145 / 1.387 s (scores 87/97/100). The actual LCP image has edge MISS on run 1 and HIT on runs 2/3, with browser disk cache false throughout; control has the same MISS/HIT/HIT pattern. Candidate light-detail runs are 2.696 / 1.232 / 1.237 s. No slow run is excluded. Passing median targets does not mean every first-source/cold-edge navigation meets 2.5 s. Cold-source delivery, initial product discovery and broader cache/response-timing coverage stay open under #86/#27/#29/#26.

Heavy-detail candidate runs are 2.131 / 1.225 / 2.149 s. CLS is zero in every paired and continuity run. The same heavy product remains the catalog/detail LCP node in the paired samples. See [per-run provenance and observed image-cache state](native-image-paint-2026-10-20/paired-mobile.json), [light detail](native-image-paint-2026-10-20/light-detail-mobile.json), and [paint probe](native-image-paint-2026-10-20/paint-probe.json). Raw reports/traces and rendered HTML remain local in /private/tmp; no full retailer payloads are committed.

Local no-hydration browser checks confirm detail/photo visibility, catalog relative stacking and the NEW badge at 412×823. The normal hosted mobile detail removes loading copy after hydration and has a loaded visible image; no warnings/errors were captured in that scoped check. Catalog return, modal open/close, focus return and photo rendering pass. Temporary viewports/tabs and local servers were cleaned up. Unit tests retain missing/error/Safari feedback; this is not a full error-network/browser matrix.

All emitted JS gzip is 186,102 B (223 B / 0.12% above the original main baseline; 43 B below the previous image candidate). CSS gzip is 10,272 B, 7 B below baseline. These are all emitted assets, not initial-route transfer. No Sharp code is in browser assets.

The opaque heavy JPEG's transformed response is byte-identical in both arms (SHA-256 and ETag match). Three interleaved end-to-end HTTP samples per arm give catalog medians 709.4 ms control / 856.9 ms candidate (+20.8%), image HIT medians 118.9 / 123.3 ms. This small remote sample includes network/TLS, server and upstream variance; it is not isolated CPU overhead evidence. The catalog timing difference is retained and is not cleared as a controlled response-regression gate. No new API/cache/freshness policy was introduced. [Response and identity probes](native-image-paint-2026-10-20/response-probes.json). Server native footprint, actual CPU/memory/billing and first-source costs remain documented limitations from the earlier image-delivery checkpoint.

**PR #85 can advance from draft to review for this scoped implementation:** substantive image payload and native paint fixes are implemented, software/preview checks pass, and representative median lab targets pass. This is review readiness with explicit remaining cold-source/response acceptance, not closure of #86 or authorization to merge. Next release action is exact-PR review/explicit merge approval, followed by production measurements if approved. #86 remains open for that release evidence and the remaining cold-source/response gates. Parent INP/accessibility/device/observation and #24/#23 operational gates remain separate.
