# Documentation verification

Reference baseline: merged PR #71 (`dc0f14b`), inspected 16 October 2026. The integration spike adds compiled Select/scroll styling and `SelectTrigger.xstyle`; planned token modules remain unavailable.

## Inventory coverage

| Area | Inspected sources / callers |
| --- | --- |
| Tokens | `src/styles.css`: 40 root variables, 39 dark overrides, 36 Tailwind aliases; literal image/backdrop exceptions and fixed metrics |
| Shared Select | All 11 exports in `src/components/ui/select.tsx`; ThemeSelect and LanguageSelect call sites |
| Shell | Header, ThemeSelect, LanguageSelect, ScrollTopButton, ThemeProvider; root shell and CatalogScreen callers |
| Action patterns | Search submit in CatalogControls; Filters/close/Reset/Apply in CatalogFilters; next-page/retry/empty reset in CatalogPanel |
| Catalog | CatalogScreen → CatalogPanel → CatalogControls/CatalogFilters/ProductGrid → ProductCard; detail route → detail screen/pending/error |
| State/helpers | ThemeProvider cookie/defaults; i18n supported values; product display/labels; cn and current utilities |
| Migration | Existing #29/#27 issue scope, source token values, official StyleX variable/theme/Vite documentation |

Inspect two or three production consumers where they exist. Theme/language provide two Select consumers. Most screen/shell components have exactly one caller; the docs say so rather than invent additional usage examples. Exported unused Select helpers and chart/sidebar scaffolding are marked as such.

## Fresh-agent prompt probe

A separate agent with fresh context read AGENTS.md, DESIGN.md and the relevant topic files, then answered this task without modifying production code:

> Write JSX for the existing catalog filter-dialog footer with Reset and Apply, an icon-only close action, and the existing language chooser. Use our existing components and design system.

| Check | Observed result |
| --- | --- |
| Reset choice | Native button, `catalog-button`, `type="button"`, existing callback/key |
| Apply choice | Native submit, `catalog-button catalog-button-primary`, existing invalid-price disabled state |
| Icon-only close | `catalog-icon-button`, translated aria-label, existing X icon/callback; stays in dialog heading |
| Language chooser | Existing LanguageSelect with no invented props; stays in Header |
| Token layer | Existing classes and semantic variables; no new color literal |
| Proposed StyleX import | Explicitly rejected because the planned module does not exist |
| Variant invention | No Button/IconButton import, variant prop, or invented size |

The probe found a missing verification-page link while this page was being drafted; this file resolves it. No component-rule ambiguity was reported for the exercised cases. This is one consumption probe, not proof that every future agent or every screen will comply. Native button classes have no TypeScript variant union; documentation does not enforce them at compile time.

## Repeat after changing APIs

1. Inspect the changed implementation plus all current callers and update the closed choices/defaults first.
2. Prompt a fresh agent with one real task that exercises the changed choice, using only the root doc pointer as its starting context.
3. Compare output with source: component imports, props/classes, token layer, semantics and hierarchy. Patch the docs for every drift, then rerun a fresh prompt. Keep probes outside production routes.
4. Check local Markdown links, the root/topic line budgets (under 100/150), and token-row equality against `:root`/`.dark` after any value change.
5. A docs-only change needs reference/example checks and `git diff --check`. Runtime tests, screenshots and build checks belong to implementation changes; do not claim a documentation probe validates visual parity or StyleX integration.


A fresh reader reran the prompt probe against the StyleX spike and returned
the existing native Reset/Apply/close actions, Header language chooser, and
implemented `SelectTrigger.xstyle` override without API drift. The language chooser still uses `LanguageSelect` without caller
props; its internal trigger now uses the documented typed `xstyle` override.
No Button/IconButton or new Select size/variant was introduced. Runtime parity
and regression evidence lives in [the spike report](../evidence/stylex-integration-spike.md).
