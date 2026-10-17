# Phase 7D — Shiori Editorial implementation

Started from merged StyleX baseline `87ed85d` on `codex/shiori-editorial`.
Tracking: #27 (experience), #16 (localization), #74 (deferred motion polish).
This branch is unpublished work; completing a slice does not imply release readiness.

## Approved sources

- #12: Version 2 Shiori Index; evidence `db5f922d49cdc41701e5b5133b4997b0dfa9070b`.
- #15 / #16: Direct locale selector and Weekly masthead; evidence
  `62679272b0fce4ca22b4d9379bdab3ba3200dcb4`.
- Use the selected design and localization prototype files as references only.
  Do not import their fixtures, picker routes, or private prototype hooks into production.

## Implementation slices

1. **Started:** approved three-language Weekly copy, compact masthead and responsive
   1/2/3-column grid at the prototype's 520/800px boundaries. Retain real catalog
   data and current route/search contracts while building subsequent slices.
2. Port warm-light/charcoal-dark semantic tokens, restrained header, card hierarchy,
   image treatment, language-appropriate typography and full Traditional Chinese UI.
3. Implement the Direct locale contract: URL > saved choice > browser > English;
   preserve filters, query, theme, scroll and open detail. Label per-field fallback.
4. Add sticky 200ms search, URL synchronization, accessible announcements, staged
   filtering with result count, immediate chips and clear-all.
5. Present shareable detail routes as centered dialogs with focus containment,
   inert background, scroll lock, Escape and exact return restoration. Direct
   entry and browser history must remain usable. Preserve #73's navigation fixes.
6. Add bounded progressive loading, cached-error recovery, no-match/end states and
   approved restrained motion. Keep #74's polish scoped and inspect actual motion
   before choosing new timing. Reduced motion/transparency remain part of #27.
7. Verify all languages, themes, breakpoints, keyboard/focus, SSR/hydration, SEO,
   accessibility, performance and extraction; remove production prototype entrypoints.

## Release boundary

PR #73 was explicitly merged on 17 October 2026. Verify its production deployment
and observation separately. Phase 7D implementation may progress on this branch;
its merge/production release does not bypass the StyleX observation gate. Any UI
revamp PR requires its own explicit merge authorization. The manual-sign-off
deferral for #73 does not automatically waive #27's accessibility acceptance.

## First-slice verification

All 70 existing tests, lint, TypeScript and the node-server production build pass.
A browser matrix at 390/768/1280px × en/ja/zh × light/dark confirms the approved
headlines, 1/2/3 columns and no horizontal overflow. The fresh-reader documentation
probe passes after removing retired hero/grid guidance. This verifies this slice,
not completion of the full #27 acceptance matrix.

[Matrix](../evidence/shiori-foundation/responsive-checks.json),
[desktop light](../evidence/shiori-foundation/desktop-light.jpg),
[mobile Traditional Chinese dark](../evidence/shiori-foundation/mobile-zh-dark.jpg).
