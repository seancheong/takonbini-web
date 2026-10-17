# StyleX compatibility migration (#29)

Status: full implementation on the migration branch; final review and release
gates remain. The official runtime/plugin are pinned to 0.19.1. Tailwind packages,
utilities/directives, merge helper, compiler integration and animation package
have been removed. This is a compatibility release, separate from Editorial #27.

## Implemented owners

| Owner | Responsibility |
| --- | --- |
| `src/styles/colors.stylex.ts` | Typed semantic colors; unchanged OKLCH values and named image/backdrop roles |
| `src/styles/themes.stylex.ts` | Dark overrides and one document alias bridge |
| `src/styles/metrics.stylex.ts` | Repeated target/type/radius/timing roles; one-off geometry stays local |
| `src/styles/conditions.stylex.ts` | Exact 600/640/800/1024/1100px boundaries and reduced motion |
| `src/styles/stores.stylex.ts` | Store text colors; cards own their accent edge variable |
| `src/styles/reset.css` | Attributed explicit browser reset, independent of the removed compiler |
| `src/styles.css` | Document defaults, native backdrop and view-transition pseudo-elements only |
| Component-local style tables | Explicit owned element styles for Select, shell, catalog, modal and detail states |

ThemeProvider preserves the cookie and early script, applying every generated
dark-theme class at document scope. Select portals inherit those variables.
Existing markup, props, staged filtering, route/search behavior and view-transition
identities remain. SelectTrigger's documented xstyle composes typed/dynamic
styles with native style; className is for caller CSS, not retired utilities.

## Verification and release

The [full evidence](../evidence/stylex-migration.md) replaces the earlier
[integration checkpoint](../evidence/stylex-integration-spike.md). It records the
immutable main baseline, controlled data fixtures, production geometry/style
comparisons, state/breakpoint checks, automated tests, CSS extraction, HMR,
accessibility/performance, preview and remaining release obligations.

Do not combine the rollout with the products-module move or Editorial redesign.
The previous source/lockfile and retained Vercel deployment remain rollback inputs;
no live rollback or production alias action is implied by implementation work.
The preceding release's observation and explicit approval still govern merging.
After approval/release, verify production and complete its observation window
before the Editorial release. Elapsed time alone is not acceptance.
