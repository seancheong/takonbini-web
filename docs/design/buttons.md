# Actions and navigation

## Approved catalog revamp — 17 October 2026

Search and Apply now use `colors.primary` / `colors.primaryForeground`. Store choices use card/foreground with stronger weight when selected, neutral hover borders, and small store-color dots. There are no store-colored bottom borders. The filter trigger uses card by default and secondary when expanded. The filter dialog and footer use card, separated by a border-token divider. Reset stays quiet; Apply uses primary/primaryForeground. Store choices keep a constant 500 weight to avoid movement on selection.

The compatibility-migration baseline below is retained as historical context; the approved changes above supersede its geometry and interaction restrictions.

Use the existing native action in its owning component. Use a Link for internal
navigation and an anchor for the retailer URL. There is no public Button,
IconButton, action variant prop, or importable utility-class vocabulary.

## Closed action roles

These names are private `layoutStyles` entries in their linked owner, not exports
for another component to import. Reuse them when editing that owner. A new owner
must document its real action before extracting a shared component.

| Action | Owner and style role | Behavior |
| --- | --- | --- |
| Search | [CatalogControls](../../src/features/products/catalog/CatalogControls.tsx) `searchSubmit` | Native form submit; primary foreground/background |
| Filters | [CatalogFilters](../../src/features/products/catalog/CatalogFilters.tsx) `open` | Open staged native dialog |
| Close | CatalogFilters `close` | Icon-only native button; translated label; heading placement |
| Reset | CatalogFilters `reset` | Reset draft; `type="button"`; ordinary surface |
| Apply | CatalogFilters `apply` | Valid form submit; primary foreground/background |
| Load more | [CatalogPanel](../../src/features/products/catalog/CatalogPanel.tsx) `loadMore` | Fetch next page; disabled while fetching |
| Retry | CatalogPanel `retry` | Retry the failed initial/next page; no new error variant |
| Detail retry | [ProductDetailError](../../src/features/products/detail/ProductDetailError.tsx) `retry` | Neutral 44px native button; disabled while fetching; localized loading/failure status; recover query before resetting modal/route boundary |
| Navigation recovery | [NavigationError](../../src/components/NavigationError.tsx) `retry` / `back` | Neutral 44px retry; router invalidation for requests, deliberate reload for cached import failures; ordinary catalog-return anchor preserves query |
| Empty reset | CatalogPanel `clearFilters` | Clear applied filters; no destructive treatment |
| Store choice | CatalogControls `storeChoice` | Immediate single-store choice; aria-pressed; store edge |
| Applied chip | CatalogControls `filterChip` / `clearFilters` | Remove one filter or clear all |
| Share product | [ProductShareAction](../../src/features/products/detail/ProductShareAction.tsx) `styles.share` | Opens a native share dialog with circular brand-logo destinations and names: Facebook, WhatsApp, X, LinkedIn, Email and supported native More apps. Always-visible clean URL/Copy row. Neutral trigger and copy controls; destinations/Close/arrows have 44px minimum targets. Copy/native actions disable while pending. |
| Scroll action | [ScrollTopButton](../../src/components/ScrollTopButton.tsx) | Dedicated primary-token icon control; no variants |

Search/Apply are the only catalog primary actions. The scroll action preserves
its existing brand-primary token; do not copy that color onto catalog submits.
Other ordinary actions use card/border colors, 44px minimum height, and visible
keyboard focus. Preserve each owner's exact geometry; Retry is not identical to
Load more merely because both are buttons.

Correct inside CatalogFilters:

```tsx
<button type="submit" disabled={!isPriceValid}
  {...stylex.props(layoutStyles.apply)}>
  {t("product.filters.apply")}
</button>
```

Incorrect: `<Button variant="danger">Reset</Button>`. That API does not exist and
Reset is not destructive. Incorrect: `className="catalog-button"`; the old class
has been retired. Do not guess generated StyleX class names.

Keep the close action in the dialog heading and the language chooser in Header.
Loading, disabled, pressed, selected, invalid and focus states stay owned by the
existing component. Do not replace staged Apply with immediate checkbox updates.

Search and Apply alone carry `data-slot="catalog-submit"` for 120ms press feedback at scale 0.97. Keyboard activation, disabled actions, and reduced motion do not scale. This is an owned motion hook, not a reusable visual variant.

CatalogControls owns `stickyOpen` (neutral filter-dialog trigger), `stickyChip` (composed after its existing filterChip), and `stickySummary` (compact-screen dialog access). None uses the primary Search/Apply treatment. The sticky count shares the original filter-trigger semantics and excludes search.

For #102, VirtualCatalog owns neutral44px `action` buttons for Load more, paging Retry and Start from the beginning. CatalogPanel retains the initial-load Retry action. Do not import either owner's private style table. The manual-loading toggle was removed at the user’s request.


For #114, CatalogPanel owns the quiet underlined `browse` entry Link. BrowseScreen owns its private neutral44px `link` role for Back to main catalog, First page and Next page. These navigate SSR collection pages rather than fetching into the infinite list. They use foreground text, underline, ring focus and existing semantic tokens; they are not primary or manual-load actions.
