# Tokens and themes

Sources of truth: [colors](../../src/styles/colors.stylex.ts), [dark theme](../../src/styles/themes.stylex.ts), and [metrics](../../src/styles/metrics.stylex.ts). `colors` uses defineVars and darkTheme uses createTheme; themeStyles.bridge maps the retained document/derived-color names onto those values. There is one palette.

## Allowed layer

Components use the semantic variables below, through typed StyleX references; the CSS aliases remain for document defaults and derived color expressions. Add/change literal color values only in the token source as a reviewed token change. Only exported names in the linked modules are importable. `--primary` does not mean “use this for every main button”; catalog primary actions use foreground/background.

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
| `--background` | `oklch(0.965 0.004 286)` | `oklch(0.14 0.006 286)` |
| `--foreground` | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)` |
| `--card` | `oklch(0.99 0.002 286)` | `oklch(0.2 0.006 286)` |
| `--card-foreground` | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)` |
| `--popover` | `oklch(0.99 0.002 286)` | `oklch(0.2 0.006 286)` |
| `--popover-foreground` | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)` |
| `--primary` | `oklch(0.515 0.26 276)` | `oklch(0.515 0.26 276)` |
| `--primary-foreground` | `oklch(1 0 89.9)` | `oklch(1 0 89.9)` |
| `--secondary` | `oklch(0.561 0.236 277.7)` | `oklch(0.561 0.236 277.7)` |
| `--secondary-foreground` | `oklch(1 0 89.9)` | `oklch(1 0 89.9)` |
| `--success` | `oklch(0.528 0.098 171.5)` | `oklch(0.473 0.086 174.3)` |
| `--success-foreground` | `oklch(1 0 89.9)` | `oklch(1 0 89.9)` |
| `--success-accent` | `oklch(0.595 0.113 169)` | `oklch(0.663 0.125 167.3)` |
| `--link` | `oklch(0.515 0.26 276)` | `oklch(0.68 0.168 281)` |
| `--store-seven` | `oklch(0.553 0.174 38.4)` | `oklch(0.758 0.159 55.9)` |
| `--store-lawson` | `oklch(0.488 0.217 264.4)` | `oklch(0.714 0.143 254.6)` |
| `--store-family` | `oklch(0.508 0.105 165.6)` | `oklch(0.773 0.153 163.2)` |
| `--muted` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` |
| `--muted-foreground` | `oklch(0.46 0.02 285.938)` | `oklch(0.705 0.015 286.067)` |
| `--accent` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` |
| `--accent-foreground` | `oklch(0.21 0.006 285.885)` | `oklch(0.985 0 0)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.396 0.141 25.723)` |
| `--destructive-foreground` | `oklch(0.577 0.245 27.325)` | `oklch(0.637 0.237 25.331)` |
| `--border` | `oklch(0.92 0.004 286.32)` | `oklch(0.274 0.006 286.033)` |
| `--input` | `oklch(0.92 0.004 286.32)` | `oklch(0.274 0.006 286.033)` |
| `--ring` | `oklch(0.515 0.26 276)` | `oklch(0.606 0.209 280.3)` |
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
invented `bg-indigo-500` utility. For status pairings, preserve the current NEW
success/success-foreground and upcoming destructive/success-foreground choices;
this migration does not authorize a palette redesign.
