# Catalog components and states

Public screen/query/search exports: [products.ts](../../src/features/products/products.ts). Routes consume that entrypoint; feature-internal components keep direct imports. None of the components below has a `variant`, `size`, or `theme` prop. Their data/state props are not visual variants.

## CatalogScreen and CatalogPanel

Use CatalogScreen as the `/` page; use ProductDetailScreen on the detail route. CatalogPanel is the internal query/filter/state owner, not a reusable dashboard panel.

Both accept required `filters: ProductFilters` and `onApply`. No style options/default appearance exist. CatalogScreen owns the outer spacing and ScrollTopButton; CatalogPanel owns the hero, controls, result announcements, retry/empty/loading states and grid.

Correct from [the route](../../src/routes/index.tsx): `<CatalogScreen filters={filters} onApply={(next) => navigate({ search: catalogSearch.encode(next), replace: true })} />`.
Incorrect mutation: `<CatalogScreen variant="editorial" />`; Editorial is a future release, not an implemented variant.

[CatalogPanel](../../src/features/products/catalog/CatalogPanel.tsx) has one caller, [CatalogScreen](../../src/features/products/catalog/CatalogScreen.tsx). Preserve the route's returned prefetch promise: server loading markup and client loaded count otherwise race (PR #71 regression).

## CatalogControls

Use [CatalogControls](../../src/features/products/catalog/CatalogControls.tsx) for current explicit-submit search, immediate store choices, and applied-filter removal; use CatalogFilters for staged multi-select editing.

Props: required `filters`, `onApply`, `children`. Children supply the filter-dialog trigger. No variants/default style props exist. CatalogPanel is its only caller.

Correct from CatalogPanel: `<CatalogControls filters={filters} onApply={onApply}>` with ProductFilterDrawer as its child. Incorrect mutation: converting the search onChange into immediate onApply; it changes today's submit-based contract.

See [buttons](buttons.md) for closed action styles and [forms](forms.md) for dialog/field semantics.

## ProductGrid

Use [ProductGrid](../../src/features/products/catalog/ProductGrid.tsx) for a list of products; use ProductCard only within that grid. CatalogPanel owns empty/loading/error/pagination presentation.

Props: required `products`, optional `filters`. It has no density/columns variant. Forward filters so detail navigation retains catalog context. CatalogPanel is its only caller.

Correct from CatalogPanel: `<ProductGrid products={products} filters={filters} />`. Incorrect mutation: adding `density="compact"`; current responsive columns are CSS-defined, not a prop.

## ProductCard

Use [ProductCard](../../src/features/products/catalog/ProductCard.tsx) as a product navigation link; use a button for actions and the grid for collection geometry.

Props: required `product: ActiveCatalogProduct`, optional `filters`. The first image, missing/error image state, category, store label, zero-price state, and release badges determine content; none is a variant prop.

Correct from ProductGrid: `<ProductCard key={product.id} product={product} filters={filters} />`. Incorrect mutation: rendering the card as a clickable div; it loses native link behavior and modifier clicks.

```text
Product image available? → existing proxy image + loading/error handling
Otherwise → existing no-image state
Release date is future? → upcoming badge
Otherwise, isNew? → NEW badge
Otherwise → no badge
```

Preserve localized fallback order, price formatting, null release dates, store token mapping, and per-product image transition identity. The native anchor name is the localized product title. See [product-display](../../src/features/products/model/product-display.ts), [product-labels](../../src/features/products/model/product-labels.ts), and [layout](layout.md).

## ProductDetailScreen

Use [ProductDetailScreen](../../src/features/products/detail/ProductDetailScreen.tsx) at `/products/$id`; use ProductCard for catalog browse. Do not create a modal detail variant during the compatibility migration.

Props: required `id: string`, `filters: ProductFilters`. Content comes from the existing detail query. There are no layout/theme variants. The detail route is its only caller.

Correct from [the route](../../src/routes/products.$id.tsx): `<ProductDetailScreen id={Route.useParams().id} filters={Route.useSearch()} />`. Incorrect mutation: omitting filters from its return Link; the visitor loses catalog context.

## ProductDetailPending and ProductDetailError

Use the exported pending/error components in the detail route's existing pending/error slots; catalog loading/error UI belongs to CatalogPanel.

Pending takes no props. Error requires `filters`; neither has variants. Keep the existing skeleton geometry, error copy and filtered return Link. All detail fetch errors currently use the not-found presentation, including its existing HTTP-error behavior; this is a compatibility constraint, not a recommended new error policy.

Correct route configuration: `pendingComponent: ProductDetailPending` and `errorComponent: () => <ProductDetailError filters={Route.useSearch()} />`.
Incorrect mutation: using ProductDetailError as an empty catalog state; it would announce a nonexistent detail failure.

```text
Catalog first load / next page / error / empty → CatalogPanel's existing states
Detail loader pending → ProductDetailPending
Detail loader fails → ProductDetailError + current filters
Detail loaded → ProductDetailScreen
```
