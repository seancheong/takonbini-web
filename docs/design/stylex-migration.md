# StyleX compatibility migration plan (#29)

Status: integration spike in progress. **StyleX 0.19.1 is installed; no `.stylex.ts` token exports exist yet.** Current component/color rules remain in [DESIGN.md](../../DESIGN.md). This plan extends [issue #29](https://github.com/seancheong/takonbini-web/issues/29); it does not publish new component APIs.

## Token map to implement

Use one source per value, with explicit mappings from the [current inventory](tokens.md). The names below are proposed file/group names; agents must not import them before the implementation commit creates them.

| Proposed owner | Inputs | Boundary |
| --- | --- | --- |
| `src/styles/colors.stylex.ts` | Existing active surface/text/edge/focus/state/store variables | `stylex.defineVars`, default light values, documented source-token mapping; retain exact OKLCH values |
| `src/styles/themes.stylex.ts` | Existing `.dark` overrides | `stylex.createTheme` over the same variable group; preserve light/dark/system provider contract |
| `src/styles/metrics.stylex.ts` | Inventoried spacing, radii, typography and motion values | Group repeated values by actual role; retain one-off layout values locally rather than inventing a giant scale |
| `src/styles/conditions.stylex.ts` | 600/800/1100px catalog rules and 640/1024px Tailwind breakpoints | Compile-time conditions/constants; CSS variables cannot substitute for media-query syntax |
| Small global CSS | Document defaults, required reset rules, native dialog backdrop and view-transition pseudo-elements | Keep browser-global rules that do not belong to component scope; record each remaining rule |

Retire unused chart/sidebar scaffolding only after an import/variable-usage check confirms it is unused. Existing raw product-image white/placeholder colors and backdrop opacity need named semantic roles with their old values. Type checking checks allowed names; visual/contrast checks verify their use. Do not invent a destructive button simply because a destructive color exists.

Sources for the intended mechanism: official [defineVars](https://stylexjs.com/docs/api/javascript/defineVars/), [createTheme](https://stylexjs.com/docs/api/javascript/createTheme/), and [Vite integration](https://stylexjs.com/docs/learn/installation/vite/). Pin and verify package versions in the spike; do not copy an old config without compiling it against the actual installed version.

## Ordered implementation

1. **Baseline:** branch from merged main; preserve original user checkout changes. Record production-built mobile/desktop screenshots and computed styles for both themes and all three locales. Capture bundle sizes, route checks, keyboard/dialog behavior, and the current reset behavior. Done when the comparison inputs are reproducible.
2. **Integration spike:** add official `@stylexjs/stylex` and `@stylexjs/unplugin`. Prove one native button plus one themed, portalled Select path in Vite dev/HMR, production build, TanStack SSR/hydration, Vitest, route loading, and Vercel preview. Verify extracted CSS is loaded before paint and precedence is stable across route changes. Inspect the generated stylesheet and browser bundle. Done when all paths work without runtime compilation errors or theme flash. A third-party plugin needs the separately documented exception required by #29.
3. **Tokens/theme:** implement the mapping above, with both theme outputs driven by one definition. Apply document-level theme styles so portals inherit the same variables. Preserve the existing cookie and early theme script. During branch-only coexistence, use a single documented bridge so CSS and StyleX do not become independent palettes. Done when every active color consumer has a mapped owner and theme/contrast checks pass.
4. **Shared primitives and shell:** convert Select first, including Radix states, popup positioning, scrolling, disabled/invalid styles and caller overrides. Then header/theme/language/scroll controls. Keep the documented Select sizes and public props. Before extracting a typed action component, document its real consumers and map each existing action class; the migration itself does not authorize new variants.
5. **Catalog and detail:** migrate action patterns, search/dialog, grid/card, skeleton/empty/error states and detail UI in reviewable commits. Replace descendant styling with explicit owned element styles while preserving DOM, screen boundaries, data attributes, focus behavior and view-transition identities. Keep search submit-based and preserve filter navigation. Done when the source and visual inventory account for every old selector and utility.
6. **Remove Tailwind:** explicitly replace relied-on Preflight/reset rules before removing the compiler. Remove utility classes, directives, `@apply`, `@theme`, `tailwind-merge`/`cn` when unused, Tailwind Vite integration, Tailwind packages and `tw-animate-css` after replacing its active animations. Inspect `class-variance-authority` usage before removal; its installation is not proof that a Button API exists. Keep unrelated dependencies only when they still have consumers.
7. **Verify/release:** pass CI/tests/types/lint/build and visual/behavior checks below; submit a separate PR. Record an immutable rollback source/deployment and explicit release approval. PR #71's observation limits StyleX merge/release; isolated implementation and preview work can proceed now. After release, verify production and observe it before the Editorial release.

## Required parity matrix

| Area | Check |
| --- | --- |
| Widths | 390px, 768px, 1280px; both sides of 600/640/800/1024/1100px boundaries used by the changed component |
| Themes/locales | light/dark/system; `en`, `ja`, `zh`; image canvases and long localized text |
| Controls | hover/focus/pressed/disabled/invalid/open/selected, keyboard traversal, modal Escape and return focus, Radix portal inheritance |
| Data states | initial/next-page loading, empty/no matches, retry, missing image, zero price, upcoming/NEW, detail pending/error |
| Runtime | SSR content and metadata, hydration console, initial theme, direct/return navigation, URL filters and pagination |
| Motion | reduced motion, browser view transitions, Safari branch; explicitly review the existing coverage gaps in layout.md |
| Delivery | extracted CSS, ordering/cascade/reset, HMR, accessibility/contrast, Lighthouse, route responses, JS/CSS size compared with baseline |

Before declaring Tailwind removed, search source/config/package files for utility usage, directives, helper imports and compiler dependencies. Comments/documentation mentioning Tailwind are historical context; runtime usage is the removal gate. Generated classes must come from the compiler, not guessed strings.

## Documentation completion

Update these docs in the same commits as implemented StyleX tokens and component APIs. Move planned names into the current-reference topics only after the files compile and real callers use them. Keep the closed action choices/defaults and rerun the prompt checks in [verification](verification.md). Shiori palette, typography, layout and interactions remain a later #27 decision.

## Integration spike progress

The official Vite plugin extracts CSS into the stylesheet already linked by the
root document. Development uses the virtual CSS endpoint and CSS-only HMR shim.
Vitest uses the Rollup adapter to avoid starting Vite dev-server polling timers.
`ScrollTopButton` is the first native control compiled by StyleX. It consumes the
existing CSS variables; `--scroll-top-border` preserves the prior light/dark edge
opacity without introducing a second palette. Tailwind and its reset remain.

This is a foundation PR, not completion of #29. Full baseline captures, portalled
Select compilation, token/theme exports, remaining components, reset replacement,
and the complete parity/release matrix remain required. Do not remove Tailwind or
start the Editorial redesign based on this spike.
