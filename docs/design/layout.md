# Typography, layout, and motion

Sources: [document defaults](../../src/styles.css), [metrics](../../src/styles/metrics.stylex.ts), [conditions](../../src/styles/conditions.stylex.ts), [styles.css](../../src/styles.css), [Header](../../src/components/Header.tsx), [CatalogScreen](../../src/features/products/catalog/CatalogScreen.tsx), [Select](../../src/components/ui/select.tsx), [ProductDetailScreen](../../src/features/products/detail/ProductDetailScreen.tsx).

## Current values, not a new scale

Repeated control typography/target/radius values live in `metrics`; compile-time media strings live in `conditions`. One-off layout values remain local. There is no generic utility scale or `spacing.*`/`typography.*` API. Reuse the existing selector/component for the same role. Use the approved #27 values for each migrated surface; retain compatibility values on surfaces not yet migrated.

| Role | Existing value |
| --- | --- |
| Body font | System sans stack in `styles.css`; retain Japanese/Chinese fallback behavior |
| Code font | source-code-pro, Menlo, Monaco, Consolas, Courier New, monospace |
| Weekly title | Serif; clamp(2.375rem, 4.5vw, 3.875rem), weight 400, line-height 1, tracking -0.055em; CJK clamp(2.125rem, 4vw, 3.375rem), line-height 1.25 |
| Weekly support | 0.875rem on compact widths, 1rem above 800px; line-height 1.95 (2.05 for CJK), 17.5rem max on desktop |
| Result heading/count | 1.2rem weight 650 / 0.8rem with tabular numbers |
| Product title | 1rem semibold; 0.9rem at ≤600px |
| Search/price inputs | 1rem; preserve 16px input text to avoid iOS focus zoom |
| Catalog button text | 0.85rem, weight 600 |
| Applied-filter text | 0.75rem |
| Availability text | 0.8rem / 1.6 |
| Header | 64px high, fixed, z-index 50; inner max width 72rem |
| Catalog outer | 1rem horizontal, 4rem bottom, 7rem top; preserve clearance below fixed header |
| Catalog panel | 1.75rem vertical gap; 72rem maximum width |
| Grid | 1 column through 520px; 2 at 521–800px; 3 above 800px |
| Grid gaps | 1.5rem rows / 1rem columns; 1rem / 0.65rem at ≤600px |
| Product image | 1:1 aspect ratio, white canvas |
| Product copy | 1rem padding, 0.8rem gap; 0.75rem padding at ≤600px |
| Catalog action radius | 0.35rem; card/search 0.4rem; filter option/chip 0.3rem |
| Dialog | 640px max width, max height min(85dvh, 850px), 0.6rem radius |
| Mobile dialog | ≤600px, bottom aligned, full width, top radii 0.75rem, safe-area footer |

Breakpoints are owned by their surfaces: Shiori grid 521/801px, compact controls 600px, shell labels 640px and detail columns 1024px. Check both sides of every boundary used by the component.

ProductGrid's owned 1/2/3-column style is the approved geometry. Reintroducing the compatibility 2/3/4-column grid is an incorrect mutation.

## Interaction and motion

- Catalog button background/border transitions are 150ms; cards transition border-color for 150ms. Preserve properties and timings, not `transition: all`.
- Product images use per-product view-transition names. [ProductCard](../../src/features/products/catalog/ProductCard.tsx) delegates transition timing to the router after data loading; preserve its reduced-motion/Safari branches and modifier-click handling. Reintroducing a browser transition around a network request recreates the PR #71 timeout.
- Global view-transition pseudo-elements live in CSS; root/header/filter snapshot animations have explicit rules. Keep browser pseudo-elements in the small global stylesheet when StyleX cannot express them at component scope.
- Catalog/dialog reduced-motion CSS disables descendant animations/transitions and sets view-transition duration to zero. Preserve it. Select transitions/animations, detail pending pulses and the Safari loading spinner honor reduced motion. ScrollTopButton uses immediate scrolling for that preference. Preserve these explicit rules.
- Keyboard focus must stay visible; catalog/dialog controls use a 2px ring with 3px offset, search wrapper uses 2px offset, and Select uses its own border/ring rules. Keep those distinctions during #29.
- Catalog controls are at least 44px tall. The raw Select sizes are smaller; shell callers explicitly enforce 44px minimums. Preserve the caller override rather than assuming the base primitive passes every touch check.

Use [token roles](tokens.md) for all color-bearing declarations. Current fixed measurements are compatibility evidence, not permission to invent a new global token or universal spacing rule.

## Shiori implementation branch

WeeklyMasthead replaces the compatibility hero with the approved compact serif
introduction. It uses a single column through 800px, then a 1.4fr/0.6fr split.
CJK titles use 1.25 line height and language-specific serif stacks. ProductGrid
uses one column through 520px, two through 800px and three above 800px. Other
compatibility components retain their prior layout until their #27 slice lands.
