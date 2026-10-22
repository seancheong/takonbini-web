# Infinite catalog browsing with bounded memory

Status: implemented locally, 22 October 2026; review, merge and production acceptance remain pending. See docs/evidence/infinite-catalog-2026-10-22.md. The plan below preserves the agreed scope and initial budgets. User selected this feature ahead of the remaining release-closeout work. Track under the existing Wayfinder maps #5/#36 and implementation tracker #17; create one feature issue, not a new map.

## Outcome and scope

Browse automatically into later results without accumulating every product/card in memory. Refresh and product-detail Back return to the same browsing context, with an honest fallback when inventory changes. Keep existing photography, cards, responsive columns, filters, locales, themes, modal sharing and server-rendered first results.

Not included: visual redesign, new sorting controls, new backend storage/scheduler, offline catalog, cross-device restoration, arbitrary page-number jumping or an exact historical catalog snapshot. Existing security/reliability/observation gates remain separate. No implementation, PR merge or production release is authorized by this planning record alone; implementation is the requested next step, and any specific PR merge still needs explicit approval.

## Verified starting point

Inspected source at PR #101 head 75bb1b914b81c00269de15a0d81f71f88b086b29, whose merge is current main b527c1127b89d8a0fe22cff6f5c52c48bfc6d4f8. Start implementation from latest main, not this workspace's older dependency-security checkout.

- CatalogPanel uses useInfiniteQuery, flattens all pages, and has explicit Load more/retry/end states. ProductGrid maps every product into a ProductCard.
- product-queries has forward nextCursor, 30-minute staleTime, one-hour gcTime, and no page cap. CatalogPage exposes products and optional nextCursor; there is no previous-cursor or seek-by-product contract in the web boundary.
- Router restoration keys catalog state by normalized filters. Filters currently navigate with resetScroll:false. Native product modal focus return locates the originating card by data-product-id; refresh of a masked product URL deliberately becomes standalone detail (unmaskOnReload:true).
- Existing responsive cards and their heights vary with viewport and localized text. Use existing breakpoints, rather than a guessed fixed-height card.

## UX contract

| Action | Behavior |
| --- | --- |
| Ordinary catalog visit | First results, top of catalog; no surprise restoration from an unrelated visit. |
| Approach loaded range end | Prefetch one next page; keep visible results stable. |
| Scroll back into an evicted page | Re-fetch that page using its recorded input cursor; preserve anchor while replacing its spacer. |
| Refresh catalog | Restore same-tab, matching-filter product anchor and relative viewport offset when valid. |
| Product modal close / browser Back | Materialize originating card before restoring focus/position; never unmount the active modal's return target during dismissal. |
| Refresh masked product URL | Preserve existing standalone product detail behavior. Back/return-to-catalog uses saved catalog context where available. |
| Apply different filters/search | Cancel obsolete work; show new results at results start, accounting for sticky header/filter bar; do not pull in an old filter position. Explicitly supersedes documented resetScroll:false behavior. |
| Change language or viewport | Preserve product identity, remeasure rows, then correct offset; do not assume previous pixel geometry remains valid. |
| Missing anchor / stale cursor | Try another recorded nearby anchor within the request budget, otherwise show first results with localized explanation. Never loop or walk all preceding pages. |
| Fetch failure | Keep readable cards; show localized retry; automatic fetching pauses until retry. |
| End of results | Announce end once; stop fetching. |

Refresh restoration does not automatically steal keyboard focus. Product dismissal restores card focus. Persisted positions apply only to explicit reload/history return, not every fresh navigation. Preserve URL filters and existing language preference ownership; do not introduce an unsupported sort parameter.

## Proposed design

1. Use IntersectionObserver for a range-edge loading sentinel, not per-card deletion. Guard pending/error/end/hidden-tab/restoration states; deduplicate requests and disconnect observers. Pass AbortSignal through query/browser transport where supported so stale filter requests can be canceled.
2. Use @tanstack/react-virtual's window virtualizer for measured responsive grid rows. Initial SSR and hydration render the same first-page markup; activate virtualization after hydration with reserved image geometry. Preserve document scrolling and reachable footer. Two rows of overscan per side is the initial setting, subject to measurement. Keep focused cards and modal return anchors mounted or materialize them before focus transfer.
3. Separate page payloads from the logical browsing directory. Initial explicit cap: five resident pages per active catalog, at most 100 products at the default page size20; normalize and enforce a supported page-size bound rather than trusting URL limit. Account for all duplicate query/detail/router caches, not just the flattened array. Do not merely set maxPages on the current forward-only infinite query: discarded earlier pages need a reload path.
4. Keep compact page descriptors (input cursor, expected next cursor, logical range, bounded row geometry, nearby product IDs) so payload eviction preserves scroll extent and backward reload. Fetch a recorded page directly rather than replaying cursors from page1. Candidate: page-addressed queries plus a dedicated browsing-window coordinator; choose this over infinite-query maxPages if the current forward contract cannot support previous-page recovery cleanly.
5. Bound metadata too: initial maximum512 page descriptors and256KiB serialized session state, maximum3 saved catalog contexts, TTL30minutes. Keep only active range plus focus exception in RAM; use session storage for compact descriptors, no full product payloads/HTML/images. Cap inactive catalog query contexts and stale detail queries. Storage disabled/quota/corruption degrades to functional browsing with best-effort in-memory restoration. Reaching history capacity must produce an explicit bounded restart path, not silently broken upward scrolling.
6. Anchor record: schema version, normalized filters/page size, page input cursor, product ID, relative viewport offset, nearby IDs, timestamp and layout context. Save on settled scrolling/page lifecycle without React state updates each frame. Restore with a maximum3 page reads total, cancel immediately on user scrolling/navigation, and never persist full catalog data. Cursor invalidation/expiry and inventory shifts are expected; validate response/anchor and degrade visibly.
7. Coordinate router and virtualizer restoration so only one owns final catalog position. Modal scroll locking, sticky filter offset, scroll-to-top and Back/Forward remain covered. Scroll-to-top loads first page if evicted; do not animate a long trip through missing pages.
8. Retain an accessible Load more action and provide a discoverable manual loading mode so the footer remains reachable. Manual mode is per-tab; auto mode must pause after failure and while dialogs/restoration are active. Define keyboard traversal across virtual boundaries: keep focused row mounted, render the next focusable row on demand, and maintain logical order without focus landing in removed DOM. Use polite localized loading/count/end messages; count means reached results, not currently resident cards. Do not add aria-grid semantics without implementing its keyboard model.

All numeric caps above are proposed initial implementation budgets, not measured performance claims. Record any justified adjustment before acceptance and keep the guarantee bounded.

## Implementation sequence

1. Contract/restoration spike: verify current deployed API cursor reuse after reload and normal refresh, page-size limits and invalid-cursor behavior, without private data publication. Prove direct re-fetch of a previously recorded page and bounded backward access with synthetic fixtures. Settle coordinator and router ownership before UI work. If the current API cannot meet the contract, document the smallest necessary API change; do not silently expand into backend migration.
2. Implement bounded paging/window and versioned anchor persistence with tests for eviction, backward recovery, duplicates, cancellation, invalid cursors, expired storage and hard request/context limits.
3. Implement measured row virtualization and sentinel loading using existing StyleX cards/action roles. Preserve initial SSR, image priority, breakpoint geometry, retained spacers and anchor corrections.
4. Integrate refresh/Back/Forward/modal focus, filter reset, locale/resize, manual mode and localized recovery; update implemented design docs alongside implementation.
5. Run targeted regressions and browser profiling; prepare a reviewed PR with evidence and explicit limits. Obtain explicit merge approval, then verify exact production release. Reconcile feature issue and #5/#36/#17, preserving unrelated closeout gates.

These are five steps within one feature, not five new Wayfinder phases. Do not introduce unrelated cleanup or changes to dependency PR #91.

## Acceptance gates

- [ ] Paging: one request per cursor at a time; no duplicates/skips for stable fixtures; pause/retry/end/cancel behavior; original filters preserved through all page requests.
- [ ] Bounded payloads: at most5 resident pages at normalized page size; focused/selected product may add a documented single-product exception. Inactive query/detail/router caches and session metadata obey explicit limits. No unbounded products/pages array remains.
- [ ] Bounded DOM: mounted catalog cards limited to measured viewport rows plus2 overscan rows on each side plus at most1 focus-pinned row. No growth with pages traversed. Stable keys and no blank gaps/jumps during replacement.
- [ ] Restoration: deep-scroll reload and detail Back recover product anchor within16 CSS pixels after layout settles on unchanged data; no more than3 restoration page reads; expired/missing/changed data fallback is visible and bounded. Resize/locale cases preserve identity; intentional user scrolling cancels restoration.
- [ ] Accessibility: keyboard can traverse beyond current render window in both directions, open/close detail and nested share, and reach manual loading/footer. Native focus/dialog behavior, VoiceOver announcements, reduced motion, en/ja/zh and empty/error states pass scoped verification.
- [ ] SSR/SEO: first result content is server rendered without hydration mismatch; product links, canonical/sharing metadata, sitemap and missing-product404 regression stay correct.
- [ ] Performance: profile repeatable long down/up scroll over at least50 synthetic pages and multiple filter contexts, plus real-content samples. Record mounted cards, resident products/pages, requests, descriptor bytes, detached DOM/listeners and heap after settled/GC checkpoints where available. Browser image cache/GC may retain memory; bounded app data/DOM is enforceable, a fixed total browser-memory ceiling is not. Compare initial load/interaction against same-host baseline; investigate material regressions rather than claiming a memory win from fewer nodes alone.
- [ ] Verification: relevant suite/types/lint/build and compiled route checks; immutable preview browser verification in supported Safari/Chrome, representative compact/tablet/desktop widths and all locales; explicit PR approval, merge and exact production verification remain distinct gates.

## Primary references

- TanStack infinite queries, page limits and bidirectional prerequisites: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- TanStack Virtual measurement, overscan, stable item keys and scroll control: https://tanstack.com/virtual/latest/docs/api/virtualizer
- Current repository docs/design/catalog.md, src/scroll-restoration.ts, src/features/products/catalog/{CatalogPanel,ProductGrid}.tsx, src/features/products/data/product-queries.ts and src/routes/index.tsx (paths refer to current main).
