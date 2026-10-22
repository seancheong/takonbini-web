# Infinite catalog implementation — 22 October 2026

Issue #102. Base: production PR #101 / b527c1127b89d8a0fe22cff6f5c52c48bfc6d4f8. Implementation and local verification are complete; merge, exact production deployment and user acceptance are separate gates. No production data/configuration/schedule, dependency PR #91 or Vimium behavior changed.

## Implementation

Keep the20-product SSR seed, then virtualize measured responsive rows with2 overscan rows per side and at most1 focus-pinned row. A600px intersection sentinel loads later pages. Manual mode and Load more remain accessible; failures pause automatic paging without clearing readable results. Hidden tabs/dialogs pause automatic work; page reads are deduplicated and aborted on unmount/filter replacement.

Retain at most5 catalog pages including the first page (100 product records), with compact cursor/count descriptors for up to512 pages. Direct cursor re-fetch recovers evicted pages. Capacity has an explicit restart action. The first-page query keeps1 page; inactive catalog queries have immediate GC. The query-client integration removes older idle/inactive detail entries, retaining the latest detail plus active/pending consumers; a60-second handoff prevents retry results disappearing before their route renders.

Same-tab restoration saves normalized filters, cursor descriptors and product/index/viewport anchors, not product payloads. Bounds:3 contexts,256KiB,30minutes. Entry keys distinguish reload/history return from new visits and follow locale navigation without confusing modal entries. Deep restoration does not replay preceding cursors. Missing products continue nearby in the loaded page where possible; expired state or changed boundaries explain restarting. Storage denial/corruption degrades to ordinary browsing. Corrections wait for measurement and yield to intentional input.

Changed filters start at the beginning, replacing the old preserve-scroll behavior. Controls stay mounted to preserve focus. Scroll-to-top is immediate to skip evicted ranges. Product modal dismissal restores its card/focus/viewport; masked-product reload still becomes standalone detail.

## Verification

- Node24.16.0 / pnpm10.20.0:231 tests across32 files, TypeScript, Biome lint, build and git diff --check pass.
- New tests walk60 synthetic pages down and backward, retaining ≤100 catalog records; reload a deep directory without replay; reject oversized/duplicate/looped/changed pages; bound/expire/corrupt session storage; cap recent detail caching; verify observer deduplication, abortion, explicit retry, manual mode and modal pause.
- Router-pixel restoration tests were replaced because product anchors now own catalog positioning. Policy/model tests and actual browser measurements cover the replacement. Filter/scroll-to-top expectations explicitly reflect their changed UX.
- New compiled SSR check passes en/ja/zh,20 server-rendered links, page-size override resistance and1 upstream read per request; it runs in Web CI.
- Compiled detail status/recovery passes15 cases; sharing passes14 crawler-HTML cases; native image isolation/WebP and sharing JPEG/fallback pass.
- Public read-only cursor probe: page1/page2 each20 products, no overlap, replayed page2 identical IDs. This is sampled current data, not a frozen inventory guarantee.

## Browser evidence and limits

Synthetic local API:1,200 products, no retailer images/private data. In-app browser at1280 CSS pixels traversed52 known pages/1,040 encountered products with100 resident records and18 mounted cards at the sampled position. Upward scrolling recovered evicted pages within those bounds. Compiled deep refresh restored row1017 from -66.453125 to -66.46875 CSS pixels (0.015625px difference), using2 client reads plus the first-page read;60 resident products after restoration.

A compiled modal case returned focus to201 at the same scrollY40184.5; Tab continued to202. Applying Lawson reset to page1,20 resident products and scrollY0. Language/width changes retain measured rows; column changes reset geometry. Index-scroll reconciliation is canceled before anchor correction. Early hot-reload/moving-scroll observations are excluded from settled-offset acceptance; [raw observations](infinite-catalog-2026-10-22/browser-observations.json) retain exploratory results as well as passing samples.

Native Chrome compact emulation (375×667, no throttling) rendered6 sampled cards with100 products encountered. Product97 opened/closed with focus returning to97; Tab continued to98. Reload returned to the same neighborhood (95–100) and continued paging to120 encountered products. This is desktop emulation, not a physical iPhone test. The inspected local resource error was the existing Vercel Analytics script404 outside Vercel hosting; extension messages are unrelated. Responsive emulation was restored afterward. Native screenshots stay private because they include browser profile/bookmark chrome.

These are app-data/DOM bounds, not a fixed browser heap/image-cache/GC, field INP, controlled LCP or savings claim. Broad VoiceOver, physical-device and full browser-matrix acceptance are not inferred. Existing acceptance and security gates remain separate. A fresh audit of this feature lockfile awaits explicit approval after automatic review rejected sending its changed metadata; no audit result for it is claimed.

## Release gates

- [x] Implementation and local regression/compiled/browser checks.
- [ ] Exact-head hosted CI and immutable real-content preview verification.
- [ ] Review and explicit approval for this specific PR before merge.
- [ ] Exact production deployment and paging/restoration verification.
- [ ] Remaining measured accessibility/performance/resource acceptance required by #102/#27/#26/#29.

Next: review the exact feature-head hosted checks and preview. Keep #102 open. Preserve rollback/security findings, #24 closeout and #23's unstarted30-day window. A future production release requires reassessing observation scope.
