# Native product image paint — 20 October 2026

Continuation of #86 and draft #85. No merge or production deployment.

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

## Pending verification

139 tests, TypeScript and the local production build pass. Hosted preview, matched repeated mobile runs, badge/loading/error browser checks, final CI and bundle comparison follow. Keep performance acceptance open until recorded measurements pass.
