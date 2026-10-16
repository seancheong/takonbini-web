# Buttons and action hierarchy

Source: [styles](../../src/styles.css), [CatalogControls](../../src/features/products/catalog/CatalogControls.tsx), [CatalogFilters](../../src/features/products/catalog/CatalogFilters.tsx), [CatalogPanel](../../src/features/products/catalog/CatalogPanel.tsx).

## Catalog actions

Use native `button` for an action. Use TanStack `Link` for internal navigation and `a` for retailer navigation. Use the existing store-picker or chip pattern for selection/removal; an action-button style loses their state semantics.

Implemented action styles: `catalog-button` (default), `catalog-button catalog-button-primary`, and `catalog-icon-button`. Nothing else exists. These are CSS classes, not a React variant union. No shared `Button` export or `variant`/`size` prop exists, so TypeScript cannot enforce this class set.

- Default: `catalog-button` for Filters, Reset, and Load more. Keep these subordinate to form submission.
- Primary: Search in the catalog search form and Apply inside the modal. One primary per active form; the dialog is a separate task context. Primary uses `--foreground` on `--background`, not `--primary`.
- Icon action: `catalog-icon-button` for dialog close. Preserve its translated `aria-label`; an icon alone does not name the action.
- Disabled: native `disabled`; Apply is disabled for invalid prices, Load more while fetching. Disabled is state, not another variant.

Correct, from the dialog footer:

```tsx
<button type="button" className="catalog-button" onClick={onReset}>
  {t("product.filters.reset")}
</button>
```

Incorrect mutation of that caller (not an existing API):

```tsx
<Button variant="secondary" size="sm" onClick={onReset}>
  {t("product.filters.reset")}
</Button>
```

```text
Does it navigate? → Link / a with the existing link treatment
Otherwise, is it store selection or filter removal? → the dedicated pattern below
Otherwise, is it dialog close? → catalog-icon-button + aria-label
Otherwise, is it Search or dialog Apply? → catalog-button catalog-button-primary
Otherwise → catalog-button
```

Do not infer `danger`, `ghost`, `outline`, `secondary`, or `loading` variants from another library. A destructive flow has no current product requirement or implemented button treatment; design and implement it explicitly before documenting one.

## Store picker and filter chips

Use the existing picker for immediate single-store filtering; use dialog checkboxes for staged multi-store filtering. Chips remove one applied filter; Clear filters removes all applied filters and preserves the page limit.

Styles are structural: `.catalog-store-picker button`, `.catalog-applied button`, and `.catalog-applied .catalog-clear`. Default picker is All stores when the store list is empty. Selection is `aria-pressed`; store color comes from `data-store`. There is no chip `variant` prop.

Correct, from CatalogControls:

```tsx
<button
  type="button"
  className="catalog-clear"
  onClick={() => onApply({ limit: filters.limit })}
>
  {t("product.clearFilters")}
</button>
```

Incorrect mutation: assigning `catalog-button-primary` to Clear filters. It would compete with Search and replace the structural clear-link treatment.

```text
Change one store immediately → catalog-store-picker + aria-pressed
Stage several stores/categories/regions → CatalogFilters checkboxes
Remove one applied value → catalog-applied button + translated removal label
Remove all applied values → catalog-clear inside catalog-applied
```

## Existing exceptions

The catalog retry action and empty-results Clear filters action in CatalogPanel have inline Tailwind classes; neither is a reusable error/clear-button variant. Detail return links and retailer links keep their existing classes in [ProductDetailScreen](../../src/features/products/detail/ProductDetailScreen.tsx) and [ProductDetailError](../../src/features/products/detail/ProductDetailError.tsx). Scroll-to-top is a dedicated [component](../../src/components/ScrollTopButton.tsx), not another icon-button variant. Preserve these callers in #29; do not copy them to seed a second button family.

All catalog action styles have a 44px minimum height; the icon class is 44px wide. Preserve visible keyboard focus, button types, and native disabled behavior. A loading label must not remove the action's accessible name.
