# Catalog focus after history navigation — 22 October 2026

Addresses #96 under #27. Base release: `ac9c2477ca006d3ba1be8862c53fc1a479dad282`.
This is implementation and local compiled-browser verification, not a new merge,
production deployment, maintainer acceptance, or audible VoiceOver measurement.

## Diagnosis

The original browser check opened a product with Enter, used browser Back, and
asserted that the originating card link was active with no dialog remaining.
It failed repeatedly on the base: the focused document's active element was
BODY. Forward reopened with Close focused, but subsequent Escape lost card focus.
Direct open/Escape was the passing control.

Ranked hypotheses were native modal cleanup/inertness ordering, a disconnected
captured card node, and the lack of a logical target when Forward reopens.
A temporary loopback-only focus-call probe distinguished them:

| Observation at the failed cleanup focus call | Result |
| --- | --- |
| Captured card still connected | true |
| Open dialog elements in document | 0 |
| Card inside an explicit inert ancestor | true |
| Active element after focus attempt | BODY |
| Focus attempt succeeded | false |

CatalogPanel makes results inert during the same-route navigation/loading cycle.
ProductPreview cleanup tried to focus its saved element before that state cleared,
so the browser ignored the call. The disconnected-node hypothesis was disproven.
Forward additionally captured the current document focus rather than a dependable
originating product target.

## Implementation

CatalogPanel now retains the selected product ID until the modal closes and the
catalog is no longer loading/refreshing. It resolves the corresponding card by
its owned `data-product-id`, then focuses it with preventScroll. An absent card
falls back to the existing focusable catalog h1. Focus already restored by the
browser or chosen by the visitor is respected. No timeout, custom focus trap,
new history field, style/color, or extra data request was introduced.

ProductPreview retains native dialog dismissal and page scroll ownership; its
early unmount-time catalog focus attempt is removed. Nested Share and Filters
retain their own focus behavior.

## Verification

- New owner-level regressions initially produced **3 failures / 10 passes** in
  `tests/product-panel.test.tsx` on the base implementation. They exercise modal
  removal during navigation, later inert-state removal, history reopening from
  unrelated focus, and absent-card fallback. A fourth check protects focus chosen
  while waiting. The modal/query/router seams are controlled in jsdom; native
  inert focus behavior is separately verified in the browser.
- Final full suite: **27 files / 213 tests pass**. TypeScript, Biome lint, build and
  diff whitespace checks pass. Existing jsdom Window.scrollTo warnings remain.
- The original failing browser Back check passes against the compiled candidate.
  [Six locale/theme history cases](catalog-history-focus-2026-10-22/browser-matrix.json)
  cover en/ja/zh × light/dark: Back returns to the product card, Forward focuses
  modal Close, and Escape after Forward returns to the matching card. This is the
  Codex in-app browser, not six real browser/device combinations.
- A second-page product in a search + store-filtered catalog returns with all 40
  loaded cards, unchanged search/store state, the selected card focused, and the
  same measured scroll position (7363 CSS pixels before and after). Pointer Close
  after Forward and nested Share Escape preserve the same return behavior.
- Direct open/Escape and filter-trigger Escape restoration pass. The two scoped
  English catalog axe-core 4.10.3 checks (light/dark) have zero violations; prior
  manual catalog review explanations remain applicable, not newly inferred passes
  for every WCAG or dialog state.
- The diagnostic focus-call override was removed and original Back plus
  Forward/Escape checks rerun successfully. Screenshots and raw API/retailer/focus
  logs remain private/local. Only the sanitized case matrix is retained here.

Reduced-motion and preference CSS are unchanged. Keyboard dismissal is covered;
this fix does not add a new OS reduced-motion/VoiceOver/device acceptance matrix.
Unit tests cover missing-card fallback and respecting a visitor's intervening
focus; those cases are not claimed as additional production browser measurements.

## Release gates

Keep #96 open until its reviewed, explicitly approved merge and exact production
verification. #27/#17/#26/#29 retain their broader accessibility, recovery,
performance/resource/cost and observation gates; #94's scoped production recovery
completion remains separate. No production faults, data/configuration changes,
scraper/schedule changes or dependency changes were made by this task.
