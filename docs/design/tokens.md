# Tokens and themes

Source of truth: [src/styles.css](../../src/styles.css), `:root`, `.dark`, and `@theme inline`. Semantic variables currently contain literal OKLCH/rem values; there is no separate primitive palette or StyleX token module.

## Allowed layer

Components use the semantic variables below, through existing CSS or Tailwind semantic utilities. Add/change literal color values only in the token source as a reviewed token change. A planned StyleX name is not an importable API. `--primary` does not mean “use this for every main button”; catalog primary actions use foreground/background.

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

Every row below is a declared variable, not a recommendation to use every token. Values are copied from the source; recheck it when changing a token. The `--radius` value inherits in dark mode.

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
| `--chart-1` | `oklch(0.646 0.222 41.116)` | `oklch(0.488 0.243 264.376)` |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | `oklch(0.696 0.17 162.48)` |
| `--chart-3` | `oklch(0.398 0.07 227.392)` | `oklch(0.769 0.188 70.08)` |
| `--chart-4` | `oklch(0.828 0.189 84.429)` | `oklch(0.627 0.265 303.9)` |
| `--chart-5` | `oklch(0.769 0.188 70.08)` | `oklch(0.645 0.246 16.439)` |
| `--radius` | `0.625rem` | `0.625rem` |
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.21 0.006 285.885)` |
| `--sidebar-foreground` | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)` |
| `--sidebar-primary` | `oklch(0.21 0.006 285.885)` | `oklch(0.488 0.243 264.376)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` |
| `--sidebar-accent-foreground` | `oklch(0.21 0.006 285.885)` | `oklch(0.985 0 0)` |
| `--sidebar-border` | `oklch(0.92 0.004 286.32)` | `oklch(0.274 0.006 286.033)` |
| `--sidebar-ring` | `oklch(0.871 0.006 286.286)` | `oklch(0.442 0.017 285.786)` |

## Aliases and exceptions

- `--scroll-top-border` bridges the migrated scroll action: `var(--primary)` in light mode and `color-mix(in oklab, var(--primary) 60%, transparent)` in dark mode. It adds no new palette value.

- Tailwind `--color-*` aliases in `@theme inline` map the same suffix to `var(--suffix)` for background, foreground, card, popover, primary, secondary, muted, accent, destructive and their foreground partners, border/input/ring, chart-1…5 and sidebar roles. These aliases add no new palette. `success`, `link`, and store colors have no `--color-*` alias there; current callers use explicit variable references.
- Radius aliases: `--radius-sm = calc(var(--radius) - 4px)`, `--radius-md = calc(var(--radius) - 2px)`, `--radius-lg = var(--radius)`, `--radius-xl = calc(var(--radius) + 4px)`. Catalog CSS also has fixed radii; preserve those separately.
- `--chart-1`…`--chart-5` and `--sidebar*` are declared scaffolding, with no chart/sidebar component or active production consumer. Do not build a new interface around them merely because they exist.
- `--secondary`, `--link`, `--destructive-foreground`, and `.checkbox-green` are not an instruction to add a button/checkbox variant. Existing NEW status uses success/success-foreground; upcoming status uses destructive/success-foreground. Preserve current pairings in #29 and audit contrast before later palette changes.
- Catalog product image surfaces are explicitly white in both themes so retailer photography stays readable. The image-placeholder text uses `oklch(0.42 0 0)` and the dialog backdrop uses `rgb(0 0 0 / 0.45)`. These are existing localized exceptions, not colors allowed for arbitrary new controls. Promote them to named semantic tokens during #29 with unchanged values and documented consumers.
- Existing detail image surfaces and overlays also include white/opacity utilities; inventory them in the spike before replacing them. Never convert an image canvas to a theme-dark surface by guessing.
- Theme choices are `light`, `dark`, `system`; see [ThemeProvider](../../src/contexts/ThemeProvider.tsx). Current variables switch on the document `.dark` class. Preserve the cookie, early theme initialization and portalled popup inheritance during migration.

Correct, from the source: `.catalog-product { background: var(--card); border: 1px solid var(--border); }`. Incorrect mutation: replacing either value with a new hex literal or `bg-indigo-500`. Reuse the semantic role so both themes stay in sync.
