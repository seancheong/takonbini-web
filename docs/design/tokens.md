# Tokens and themes

Sources of truth: [colors](../../src/styles/colors.stylex.ts), [dark theme](../../src/styles/themes.stylex.ts), and [metrics](../../src/styles/metrics.stylex.ts). `colors` uses defineVars and darkTheme uses createTheme; themeStyles.bridge maps the retained document/derived-color names onto those values. There is one palette.

## Allowed layer

Components use the semantic variables below, through typed StyleX references; the CSS aliases remain for document defaults and derived color expressions. Add/change literal color values only in the token source as a reviewed token change. Only exported names in the linked modules are importable. `--primary` does not mean “use this for every main button”; catalog primary actions use primary/primaryForeground.

```text
Background role?
├── Page → --background / --foreground
├── Product panel or dialog → --card / --card-foreground
├── Select popup → --popover / --popover-foreground
└── Quiet field/chip/skeleton → --muted / --muted-foreground

Text or indicator role?
├── Normal → --foreground; on card/popup use its foreground partner
├── Supporting → --muted-foreground
├── Keyboard focus → --ring; ordinary edge → --border or --input
├── Invalid input → --destructive
├── Store identity → --store-seven / --store-lawson / --store-family
└── Existing release/new status → preserve its source pairing; see caveats below
```

## Declared values

Every row below is a declared variable, not a recommendation to use every token. Values are copied from the source; recheck it when changing a token. The table uses the bridge name; the typed key is its camelCase suffix. The `--radius` value inherits in dark mode.

| Variable | Light backing | Dark backing |
| --- | --- | --- |
| `--background` | `#fdfdfb` | `oklch(0.2 0.008 145)` |
| `--foreground` | `#252b26` | `#ededed` |
| `--card` | `#ffffff` | `oklch(0.25 0.008 145)` |
| `--card-foreground` | `#252b26` | `#ededed` |
| `--popover` | `#fdfdfb` | `oklch(0.25 0.008 145)` |
| `--popover-foreground` | `#252b26` | `#ededed` |
| `--primary` | `#354c3b` | `#b4c9a8` |
| `--primary-foreground` | `#ffffff` | `#1c291e` |
| `--secondary` | `#edf0e7` | `#29362d` |
| `--secondary-foreground` | `#243529` | `#dce8d7` |
| `--success` | `oklch(0.528 0.098 171.5)` | `oklch(0.473 0.086 174.3)` |
| `--success-foreground` | `oklch(1 0 89.9)` | `oklch(1 0 89.9)` |
| `--success-accent` | `oklch(0.595 0.113 169)` | `oklch(0.663 0.125 167.3)` |
| `--link` | `#354c3b` | `#b4c9a8` |
| `--store-seven` | `oklch(0.553 0.174 38.4)` | `oklch(0.758 0.159 55.9)` |
| `--store-lawson` | `oklch(0.488 0.217 264.4)` | `oklch(0.714 0.143 254.6)` |
| `--store-family` | `oklch(0.508 0.105 165.6)` | `oklch(0.773 0.153 163.2)` |
| `--muted` | `#f1f3ec` | `oklch(0.28 0.008 145)` |
| `--muted-foreground` | `#636d5b` | `#b5b5b5` |
| `--accent` | `#edf0e7` | `#334537` |
| `--accent-foreground` | `#243529` | `#ededed` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.396 0.141 25.723)` |
| `--destructive-foreground` | `oklch(0.577 0.245 27.325)` | `oklch(0.637 0.237 25.331)` |
| `--border` | `#d9ded1` | `#383838` |
| `filterOptionBorder` (typed token) | `#b4bfaa` | `#74816c` |
| `filterSelected` (typed token) | `oklch(0.9 0.035 145)` | `oklch(0.36 0.035 145)` |
| `newBadgeBackground` (typed token) | `oklch(0.93 0.035 145)` | `oklch(0.3 0.035 145)` |
| `newBadgeForeground` (typed token) | `oklch(0.36 0.065 145)` | `oklch(0.84 0.065 145)` |
| `upcomingBadgeBackground` (typed token) | `oklch(0.94 0.048 80)` | `oklch(0.32 0.048 80)` |
| `upcomingBadgeForeground` (typed token) | `oklch(0.39 0.078 80)` | `oklch(0.86 0.078 80)` |
| `errorText` (typed token) | `oklch(0.5 0.18 25)` | `oklch(0.75 0.15 25)` |
| `--input` | `#cdd2c8` | `#484848` |
| `--ring` | `#46664d` | `#b4c9a8` |
| `--radius` | `0.625rem` | `0.625rem` |

## Aliases and exceptions

- The document bridge retains semantic `--background`/`--foreground`, surface,
  state, store, focus and radius names. It contains references, not a second set
  of palette literals. Components import `colors`; global defaults/derived color
  expressions can consume the bridge.
- `metrics.radius` owns 0.625rem. Existing calculated md/sm/xl radii remain local
  expressions over its bridge. Control target/text/line and repeated action/card
  radii have actual exports in metrics; no giant spacing scale was introduced.
- Unused chart/sidebar scaffolding was removed after source-usage checks.
  Secondary/success-accent declarations do not authorize new component variants.
- `colors.imageCanvas` is white in both themes, `imagePlaceholder` is
  `oklch(0.42 0 0)`, and `dialogBackdrop` is `rgb(0 0 0 / .45)`. These retain the
  prior image/backdrop exceptions under named roles.
- `scrollTopBorder` references primary in light mode and its 60% mix in dark.
  Select's input/ring/destructive mixes retain their previous opacity values.
- Theme choices remain light/dark/system. The provider and early script own
  compiled theme classes at document scope so portalled content inherits them.

Correct: `backgroundColor: colors.card`. Incorrect: a new hex literal or an
invented `bg-indigo-500` utility. Status badges use dedicated green NEW and amber upcoming token pairs. See
[color refinements](color-refinements.md) for the changes and measured contrast.


## Product surface tokens

- `productCardShadow`: light uses a black 9% edge, 4% tight shadow, and 6% ambient shadow; dark uses one 12% white ring.
- `productCardShadowHover`: light uses a black 14% edge, 6% tight shadow, and 8% ambient shadow; dark uses one 20% white ring.

These typed tokens are defined in colors.stylex.ts and remapped by the existing dark theme. They are scoped to product cards, not general controls.

The unused productImageOutline token and its dark-theme override were removed with the redundant card image-canvas outline. Card surface/shadow tokens still define the card edge; other palette values are unchanged.
