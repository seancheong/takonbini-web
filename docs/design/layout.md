# Typography, layout, and motion

## Approved catalog revamp — 17 October 2026

The catalog uses a 32px section gap. Typography uses 12px store/tax labels, 13px Japanese supporting titles, 14px search/store/filter controls, 16px prices and introductory copy (1.6 leading), and 18px card titles (17px compact, 1.4 leading). Search and store controls sit directly on the page with a 16px gap, avoiding nested tinted containers. The results heading uses 20px / 650 text. Filters use a bounded native dialog with wrapping checkbox tiles, 24px section gaps, a scrolling body, and a persistent action footer.

The catalog hero uses clamp(30px,3.4vw,46px), weight 600, line-height 1.18. Cards use 18px / 500 titles (17px compact), 16px padded copy within an 8px-radius shared surface, and 1.15 image canvases (square compact). ProductGrid uses one column up to 600px, two from 601–799px, and three from 800px, with 40px/28px gaps. The route-backed product modal has a 1120px max width, viewport-bounded scrolling, and full-screen presentation below 600px. Its image, facts, release date, regions and source use the same detail-screen component as the standalone page. Global scrollbar-gutter stays stable.

The compatibility-migration baseline below is retained as historical context; the approved changes above supersede its geometry and interaction restrictions.

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

## Catalog interaction motion — 18 October 2026

[Motion CSS](../../src/styles/motion.css), imported by styles.css, owns scoped motion through explicit data-slot attributes. Native dialog starting styles, backdrop pseudo-elements, parent-hover image effects, and discrete display transitions live together here; component geometry and semantic colors stay in their owning StyleX tables. Do not use these selectors as general action variants.

| Interaction | Motion |
| --- | --- |
| Product preview | 8px rise + fade; 220ms entry, 160ms exit with a 4px nudge |
| Filter dialog | Desktop 12px rise + scale 0.98 → 1 over 250ms; mobile 24px rise over 280ms; 180ms exit |
| Dialog backdrop | Fade with identical panel duration and easing |
| Product image | Hover zoom to 1.025 over 150ms; fine pointers with hover only |
| Search / Apply | Press scale 0.97 over 120ms; disabled and keyboard actions stay still |
| Back to top | 6px rise + fade over 150ms; 110ms exit |
| Theme / language menu | Trigger-origin scale 0.97 + 4px nudge; 180ms entry, 120ms exit |

Dialog and menu easing is cubic-bezier(0.32, 0.72, 0, 1); image/press/scroll feedback uses ease-out. Native dialogs remain modal and retain their focus/scroll lock during pointer-triggered exit. [useDialogDismiss](../../src/hooks/useDialogDismiss.ts) finishes on the panel opacity transition, with a fallback 20ms beyond the configured exit and unmount cleanup. Filter Apply commits once dismissal completes. Browser Back still changes route immediately.

RootDocument tracks keyboard versus pointer input. Keyboard-triggered dialogs, menus, and submit actions have no motion; menu option navigation stays instant. Reduced motion disables all added effects, including fades and press/hover transforms. ThemeProvider suppresses transitions while applying theme classes. Native dialog entry and back-to-top display transitions use progressive CSS support: unsupported browsers retain functional immediate visibility changes.

The hero, initial product grid, store choices, and result replacement have no new entrance or stagger animations.

The sticky applied-filter bar appears without an entrance animation. Its fixed height is 64px; only its chip row scrolls horizontally, preserving product browsing space. Filter panel/backdrop share 250ms desktop and 280ms mobile enters, and 180ms exits; product-preview motion remains unchanged.

Catalog refresh adds an absolute loading overlay over a relative results region, preserving its height and 32px inner section gaps. A card-colored status output sticks at header height + 80px above the scrim; only its 900ms linear spinner rotates, and reduced motion disables rotation. Search text and width stay constant during refresh.

The visual-restraint pass removes the catalog eyebrow. Current hero tracking is -0.015em for Latin and normal for Japanese/Chinese. Product-detail prices use 24px tabular numerals at weight 500 with 1.4 leading. All display and interface text retain the existing system family. Status labels use 3px corners; no new page-load or scrolling motion is introduced.

The catalog return-to-top uses a450–900ms distance-based animation with cosine ease-in-out, rather than browser-controlled smooth timing. Row-size scroll compensation is suspended only during this animation and restored on completion, interruption or unmount. Wheel, touch, pointer and keyboard input cancel it. Reduced motion remains immediate; product/cache bounds are unchanged. This supersedes the earlier native smooth-scroll coordinator.

## First-response styles

Production uses TanStack Start's build-time `server.build.inlineCss` option. The root imports `styles.css` as a stylesheet so the framework records it in its route manifest; `HeadContent` emits the generated CSS, including StyleX rules, into the initial HTML. Do not restore a separate manual stylesheet link or duplicate a hand-maintained critical-style subset. Development keeps Vite's stylesheet handling and the existing StyleX CSS-only helper.

This trades a larger initial HTML document for removing a render-blocking CSS request. The framework owns inline-style hydration and retains emitted CSS assets for navigation. The installed framework marks this option experimental, so the compiled first-response check runs in CI and browser hydration/theme/navigation checks remain release gates. The check requires identical emitted/inlined CSS, no blocking stylesheet link, and a 64 KiB uncompressed CSS budget across homepage, Browse, detail and missing-product responses in all locales.

Catalog query seeds remain available for the lifetime of their request-scoped SSR query client, including the asynchronous handoff to a lazy route. In the browser, inactive catalog queries still have zero garbage-collection delay; the existing one-query-page and five-resident-page limits are unchanged.
