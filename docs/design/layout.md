# Typography, layout, and motion

Sources: [document defaults](../../src/styles.css), [metrics](../../src/styles/metrics.stylex.ts), [conditions](../../src/styles/conditions.stylex.ts), [styles.css](../../src/styles.css), [Header](../../src/components/Header.tsx), [CatalogScreen](../../src/features/products/catalog/CatalogScreen.tsx), [Select](../../src/components/ui/select.tsx), [ProductDetailScreen](../../src/features/products/detail/ProductDetailScreen.tsx).

## Current values, not a new scale

Repeated control typography/target/radius values live in `metrics`; compile-time media strings live in `conditions`. One-off layout values remain local. There is no generic utility scale or `spacing.*`/`typography.*` API. Reuse the existing selector/component for the same role. #29 must map actual values before introducing typed tokens; it must not round them into a new scale.

| Role | Existing value |
| --- | --- |
| Body font | System sans stack in `styles.css`; retain Japanese/Chinese fallback behavior |
| Code font | source-code-pro, Menlo, Monaco, Consolas, Courier New, monospace |
| Catalog hero | `clamp(2.2rem, 5vw, 4.5rem)`, weight 750, line-height 1.05, tracking -0.045em, 14ch max |
| Catalog eyebrow | 0.7rem, weight 650, tracking 0.14em, uppercase |
| Catalog introduction | 0.95rem / 1.65, 30ch max; 45ch at ≤600px |
| Result heading/count | 1.2rem weight 650 / 0.8rem with tabular numbers |
| Product title | 1rem semibold; 0.9rem at ≤600px |
| Search/price inputs | 1rem; preserve 16px input text to avoid iOS focus zoom |
| Catalog button text | 0.85rem, weight 600 |
| Applied-filter text | 0.75rem |
| Availability text | 0.8rem / 1.6 |
| Header | 64px high, fixed, z-index 50; inner max width 72rem |
| Catalog outer | 1rem horizontal, 4rem bottom, 7rem top; preserve clearance below fixed header |
| Catalog panel | 1.75rem vertical gap; 72rem maximum width |
| Grid | 2 columns; 3 at ≥800px; 4 at ≥1100px |
| Grid gaps | 1.5rem rows / 1rem columns; 1rem / 0.65rem at ≤600px |
| Product image | 1:1 aspect ratio, white canvas |
| Product copy | 1rem padding, 0.8rem gap; 0.75rem padding at ≤600px |
| Catalog action radius | 0.35rem; card/search 0.4rem; filter option/chip 0.3rem |
| Dialog | 640px max width, max height min(85dvh, 850px), 0.6rem radius |
| Mobile dialog | ≤600px, bottom aligned, full width, top radii 0.75rem, safe-area footer |

Mixed breakpoints are intentional compatibility inputs: catalog CSS uses 600/800/1100px; shell and detail callers use 640/1024px. Do not collapse these boundaries in the styling migration. Check both sides of every boundary used by the component.

ProductGrid's owned grid style is the correct geometry. Replacing it with a one-column mobile grid or a 768px tablet threshold is an incorrect mutation.

## Interaction and motion

- Catalog button background/border transitions are 150ms; cards transition border-color for 150ms. Preserve properties and timings, not `transition: all`.
- Product images use per-product view-transition names. [ProductCard](../../src/features/products/catalog/ProductCard.tsx) delegates transition timing to the router after data loading; preserve its reduced-motion/Safari branches and modifier-click handling. Reintroducing a browser transition around a network request recreates the PR #71 timeout.
- Global view-transition pseudo-elements live in CSS; root/header/filter snapshot animations have explicit rules. Keep browser pseudo-elements in the small global stylesheet when StyleX cannot express them at component scope.
- Catalog/dialog reduced-motion CSS disables descendant animations/transitions and sets view-transition duration to zero. Preserve it. Select transitions/animations, detail pending pulses and the Safari loading spinner honor reduced motion. ScrollTopButton uses immediate scrolling for that preference. Preserve these explicit rules.
- Keyboard focus must stay visible; catalog/dialog controls use a 2px ring with 3px offset, search wrapper uses 2px offset, and Select uses its own border/ring rules. Keep those distinctions during #29.
- Catalog controls are at least 44px tall. The raw Select sizes are smaller; shell callers explicitly enforce 44px minimums. Preserve the caller override rather than assuming the base primitive passes every touch check.

Use [token roles](tokens.md) for all color-bearing declarations. Current fixed measurements are compatibility evidence, not permission to invent a new global token or universal spacing rule.
