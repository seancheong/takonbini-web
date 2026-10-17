# Catalog color refinements

Forest green remains the action color. These changes make filter states easier to distinguish and reduce competing green status badges.

## src/styles/colors.stylex.ts

| Declaration | Previous | Replacement | Reason |
| --- | --- | --- | --- |
| filterSelected | No dedicated token; filters used accent (`#edf0e7`) | `oklch(0.9 0.035 145)` | Increase the selected surface's lightness gap against white. |

## src/styles/themes.stylex.ts

| Declaration | Previous | Replacement | Reason |
| --- | --- | --- | --- |
| filterSelected | No dedicated token; filters used accent (`#334537`) | `oklch(0.36 0.035 145)` | Increase selected-state separation with a fixed green hue. |
| background | `#181818` | `oklch(0.2 0.008 145)` | Give page neutrals a restrained brand hue. |
| card | `#222222` | `oklch(0.25 0.008 145)` | Keep elevated surfaces lighter than the page on the same hue. |
| popover | `#222222` | `oklch(0.25 0.008 145)` | Match the elevated surface family. |
| muted | `#292929` | `oklch(0.28 0.008 145)` | Keep quiet fields and badges on the same neutral ramp. |

## src/features/products/catalog/CatalogFilters.tsx

| Declaration | Previous | Replacement | Reason |
| --- | --- | --- | --- |
| choice.borderColor.default | `colors.border` | `colors.filterOptionBorder` | Distinguish control boundaries from quiet structural dividers. |
| choice.borderColor.:hover | `colors.input` | `colors.mutedForeground` | Keep hover visibly distinct from the stronger default edge. |
| choice.backgroundColor.selected | `colors.accent` | `colors.filterSelected` | Give selected filters a dedicated, clearer fill. |

## src/features/products/catalog/ProductCard.tsx

| Declaration | Previous | Replacement | Reason |
| --- | --- | --- | --- |
| newBadge.backgroundColor | `colors.success` | `colors.muted` | Reduce competition with primary actions and store identity. |
| newBadge.color | `colors.successForeground` | `colors.mutedForeground` | Preserve readable status text on the quieter surface. |

## Verification

All five new OKLCH values fit within sRGB. Computed WCAG 2 contrast ratios:

- Selected filter text: 10.86:1 light, 9.14:1 dark.
- NEW badge text: 4.85:1 light, 7.10:1 dark.
- Dark supporting text against card: 7.78:1.
- Filter tile edges against card: 1.91:1 light, 3.88:1 dark. Tile edges are supplementary; native checkboxes and checkmarks remain the control and selection indicators. These edge values alone are not a claim of 3:1 compliance in both themes.

Both themes were inspected in the local application. Production build, lint on changed source files, and all 77 tests passed.

## Status badge follow-up

The neutral NEW treatment above is superseded by dedicated muted green tokens. Upcoming releases now use dedicated amber tokens instead of destructive/error colors.

### src/styles/colors.stylex.ts

| Declaration | Previous | Replacement | Reason |
| --- | --- | --- | --- |
| newBadgeBackground | No dedicated token | `oklch(0.93 0.035 145)` | Restore green status identity without a solid action-colored fill. |
| newBadgeForeground | No dedicated token | `oklch(0.36 0.065 145)` | Readable dark green text. |
| upcomingBadgeBackground | No dedicated token | `oklch(0.94 0.048 80)` | Amber communicates upcoming availability without error red. |
| upcomingBadgeForeground | No dedicated token | `oklch(0.39 0.078 80)` | Readable dark amber text. |

### src/styles/themes.stylex.ts

| Declaration | Previous | Replacement | Reason |
| --- | --- | --- | --- |
| newBadgeBackground | No dedicated token | `oklch(0.3 0.035 145)` | Dark remap at the same green hue and background chroma. |
| newBadgeForeground | No dedicated token | `oklch(0.84 0.065 145)` | Pale green text with a larger lightness gap. |
| upcomingBadgeBackground | No dedicated token | `oklch(0.32 0.048 80)` | Dark remap at the same amber hue and background chroma. |
| upcomingBadgeForeground | No dedicated token | `oklch(0.86 0.078 80)` | Pale amber text with a larger lightness gap. |

### src/features/products/catalog/ProductCard.tsx

| Declaration | Previous | Replacement | Reason |
| --- | --- | --- | --- |
| newBadge.backgroundColor | `colors.muted` | `colors.newBadgeBackground` | Replace generic grey with a quiet green status surface. |
| newBadge.color | `colors.mutedForeground` | `colors.newBadgeForeground` | Match text to the status ramp. |
| upcomingBadge.backgroundColor | `colors.destructive` | `colors.upcomingBadgeBackground` | Separate upcoming availability from errors. |
| upcomingBadge.color | `colors.successForeground` | `colors.upcomingBadgeForeground` | Use a dedicated readable amber pairing. |

All eight new values fit sRGB. Measured text contrast: NEW 8.70:1 light / 8.43:1 dark; upcoming 8.12:1 light / 8.29:1 dark. These exceed 4.5:1 in both themes.


## Review follow-up: validation and detail parity

### src/styles/colors.stylex.ts

- Added `errorText: oklch(0.5 0.18 25)`; previously validation text borrowed destructive (`oklch(0.577 0.245 27.325)`). Dedicated text treatment gives 6.59:1 against white.

### src/styles/themes.stylex.ts

- Added `errorText: oklch(0.75 0.15 25)`; previously validation text borrowed destructive (`oklch(0.396 0.141 25.723)`). Raises dark-dialog contrast from 1.59:1 to 6.74:1.

### src/features/products/catalog/CatalogFilters.tsx

- `priceError.color`: `colors.destructive` → `colors.errorText`, fixing text contrast.
- `priceInput.borderTopColor`, `borderRightColor`, `borderBottomColor`, and `borderLeftColor`, each invalid selector: `colors.destructive` → `colors.errorText`, making invalid edges visible in both themes.
- `apply.backgroundColor.:active`: `colors.accent` → `color-mix(in oklch, var(--primary) 88%, var(--foreground))`, keeping the primary text pairing readable while pressed rather than switching to an incompatible secondary surface.

### src/features/products/detail/ProductDetailScreen.tsx

- `upcomingBadge.backgroundColor`: `colors.destructive` → `colors.upcomingBadgeBackground`.
- `upcomingBadge.color`: `colors.successForeground` → `colors.upcomingBadgeForeground`.
- `newBadge.backgroundColor`: `colors.success` → `colors.newBadgeBackground`.
- `newBadge.color`: `colors.successForeground` → `colors.newBadgeForeground`.

All four detail changes align status semantics and contrast with the already verified catalog token pairs.
