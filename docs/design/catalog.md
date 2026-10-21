# Catalog components and states

## Approved catalog revamp — 17 October 2026

Product modal navigation uses a same-route catalog navigation with `productModalId` history state and a `/products/$id` mask with `unmaskOnReload: true`. The catalog stays mounted; Back/close restores its scroll, filters, and loaded pages. Forward reopens the modal. Refresh/direct visits render the standalone detail route. ProductPreview keeps its Close button in view using a sticky zero-height action bar inside the modal scroll container.

ProductPreview now takes `id`, optional `product`, filters and onClose; it renders the same ProductDetailScreen as the page, with `presentation="modal"`. The old full-detail extra click is removed. The modal is up to 1120px wide, full-screen below 600px, and supports Escape, a close button, and backdrop pointer-down/up dismissal without drag-out dismissal.

NEW badges use newBadgeBackground/newBadgeForeground (muted green); upcoming badges use upcomingBadgeBackground/upcomingBadgeForeground (muted amber). Status colors are independent of actions and errors. ProductDetailScreen uses these same pairs in both modal and standalone presentations.

ProductCard now accepts optional `onPreview(product)`. Ordinary clicks open ProductPreview; modified clicks retain native detail links. The preview uses a native modal dialog, full-width contained photography, an overlaid close button, localized tax labels, and shared full detail content. Pagination and source validation remain in the existing products module.

The compatibility-migration baseline below is retained as historical context; the approved changes above supersede its geometry and interaction restrictions.

Public screen/query/search exports: [products.ts](../../src/features/products/products.ts). Routes consume that entrypoint; feature-internal components keep direct imports. None of the components below has a `variant`, `size`, or `theme` prop. Their data/state props are not visual variants.

## CatalogScreen and CatalogPanel

Use CatalogScreen as the `/` page; use ProductDetailScreen on the detail route. CatalogPanel is the internal query/filter/state owner, not a reusable dashboard panel.

Both accept required `filters: ProductFilters` and `onApply: (filters: ProductFilters) => void | Promise<void>`. Return the navigation promise so the optimistic action lasts until navigation completes. No style options/default appearance exist. CatalogScreen owns the outer spacing and ScrollTopButton; CatalogPanel owns the hero, controls, result announcements, retry/empty/loading states and grid.

Correct from [the route](../../src/routes/index.tsx): `<CatalogScreen filters={filters} onApply={(next) => navigate({ search: catalogSearch.encode(next), replace: true, resetScroll: false })} />`.
Incorrect mutation: `<CatalogScreen variant="editorial" />`; Editorial is a future release, not an implemented variant.

[CatalogPanel](../../src/features/products/catalog/CatalogPanel.tsx) has one caller, [CatalogScreen](../../src/features/products/catalog/CatalogScreen.tsx). Preserve the route's returned prefetch promise: server loading markup and client loaded count otherwise race (PR #71 regression).

## CatalogControls

Use [CatalogControls](../../src/features/products/catalog/CatalogControls.tsx) for current explicit-submit search, immediate store choices, and applied-filter removal; use CatalogFilters for staged multi-select editing.

Props: required `filters`, `onApply`, `children`; optional `isPending` (default false) and `onOpenFilters`. Children supply the filter-dialog trigger. No variants/default style props exist. CatalogPanel is its only caller.

Correct from CatalogPanel: `<CatalogControls filters={optimisticFilters} onApply={applyFilters}>` with ProductFilterDrawer as its child. Incorrect mutation: converting the search onChange into immediate onApply; it changes today's submit-based contract.

See [buttons](buttons.md) for closed action styles and [forms](forms.md) for dialog/field semantics.

## ProductGrid

Use [ProductGrid](../../src/features/products/catalog/ProductGrid.tsx) for a list of products; use ProductCard only within that grid. CatalogPanel owns empty/loading/error/pagination presentation.

Props: required `products`, optional `filters`. It has no density/columns variant. Forward filters so detail navigation retains catalog context. CatalogPanel is its only caller.

Correct from CatalogPanel: `<ProductGrid products={products} filters={filters} />`. Incorrect mutation: adding `density="compact"`; current responsive columns are CSS-defined, not a prop.

## ProductCard

Use [ProductCard](../../src/features/products/catalog/ProductCard.tsx) as a product navigation link; use a button for actions and the grid for collection geometry.

Props: required `product: ActiveCatalogProduct`, optional `filters`, `onPreview`, and `imagePriority` (default false). ProductGrid prioritizes only its first card image with eager loading and high fetch priority; subsequent cards, including appended Load more results, remain lazy. This avoids delaying the measured mobile LCP image without making every catalog image compete for early bandwidth. The first image, missing/error image state, category, store label, zero-price state, and release badges determine content; none is a variant prop.

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

The router caches catalog scroll by normalized filter values, so the return Link
and browser Back restore the catalog position. Different filters use a separate
position; detail routes retain history-entry scroll keys. Navigation to/from
detail must not insert loading content into the catalog flow: it changes grid geometry during restoration. Catalog-to-catalog refresh uses an overlay over the existing results instead.

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


## Product card surfaces

Each product has one card-colored surface with an 8px radius around both photography and copy. Copy has 16px padding. Light mode uses a layered productCardShadow; dark mode maps it to a 1px translucent white ring. Hover changes the shadow over 150ms; on fine hover pointers, the image also scales to 1.025 over 150ms while the card stays stationary. Reduced motion disables the zoom. The article clips the image to the outer corners; the image canvas has no additional outline. Loading cards share the surface, radius, padding, and responsive image aspect ratio.

## Implemented styling

All catalog/detail elements now use their owner's private `layoutStyles` entries
via `stylex.props`. The old catalog selectors and Tailwind utilities are retired.
Do not import a private style table from another module or recreate a utility
layer. Keep state, markup, route/search contracts and view-transition identities
unchanged when editing these styles. Store text uses the typed `storeTextStyles`
group; the card sets its own `--store-accent` for the owned copy edge.

The search/dialog/grid breakpoints remain 600/800/1100px, and detail columns switch
at 1024px. Native modal semantics, controlled draft filters, pagination, data
states and image failure handling remain in their existing owners. See the
[full migration evidence](../evidence/stylex-migration.md) for parity coverage.

ProductPreview uses a 220ms rise/fade and 160ms quieter exit with a synchronized backdrop. Close, backdrop dismissal, focus restoration, and root scroll locking remain native-dialog behaviors. Keyboard and reduced-motion actions stay immediate; see [motion](layout.md#catalog-interaction-motion--18-october-2026).

## Sticky applied-filter access

CatalogControls observes its in-flow controls with IntersectionObserver. Once their bottom passes the sticky header, it renders an opaque, 64px fixed bar immediately below `metrics.headerHeight`, on layer 19 (below the header and native dialogs). It disappears when the original controls return. Search/store geometry remains in flow; no duplicate content reserves space or shifts the grid. Header carries `data-slot="app-header"` for measurement; viewport resize refreshes the observer threshold.

CatalogPanel supplies `onOpenFilters`, which copies applied filters to the existing draft and opens the same native dialog. The bar shows the existing applied-filter removals in one horizontally scrollable desktop row. At <=600px it shows a single-line, ellipsized summary button that opens the full dialog, with full accessible text. The count follows the original trigger: search is summarized but excluded from the filter count. No filters uses localized copy. Focus rings, 44px controls, typed semantic colors, and the existing neutral action hierarchy apply. Root scroll padding includes the extra bar while it is present.

## Optimistic filtering and loading feedback

CatalogPanel owns `useOptimistic(filters)` and runs filter actions inside an async `useTransition`. The action sets the optimistic filters immediately, then awaits the `onApply` navigation promise. Controls, applied chips, and filter counts use that optimistic value; product queries and product navigation continue to use committed route filters. Superseded/canceled actions revert to the current committed state, and rapid store changes use the latest displayed filter values. Opening the staged dialog copies the displayed filters; applying still confirms the draft.

Refresh keeps the current result grid mounted in a relative results region. Its content becomes inert and aria-busy while an absolute scrim blocks stale-product interaction. A separate output announces loading and remains visible with sticky positioning when browsing a long grid. The loading overlay adds no flow height. Its spinner uses transform-only motion and becomes static for reduced motion. Search always keeps its localized Search text; the pending refresh row is removed. Initial loads retain skeletons; pagination retains its own existing progress indicator. Detail navigation does not trigger the filtering overlay.

Filter changes use `resetScroll: false` in the catalog route navigation. This preserves the current viewport when selecting a store, clearing filters, or applying a dialog draft, including when the target filter combination has an older cached position. Product/detail Back navigation retains the existing per-filter restoration keys. Browsers may still clamp scroll when a shorter result list cannot fill the previous position.

## Visual restraint pass — 18 October 2026

The catalog takes its visual cues from convenience-store shelf labels: real product photography, retailer-specific label colors, Japanese source names beneath translations, aligned prices, and small rectangular status labels. Preserve these content-specific choices instead of adding decorative marketing sections, gradients, glass surfaces, or entrance sequences.

The redundant Product catalog eyebrow is removed. The existing system font stack remains; the headline uses weight 600, 1.18 leading, -0.015em Latin tracking, normal Japanese/Chinese tracking, and balanced line wrapping. NEW/upcoming badges use 3px corners in both cards and detail. Cards retain their shared surface/shadow; the extra image-canvas outline is removed. Safari's opaque navigation overlay keeps its spinner but drops a blur that had no useful content to reveal.

Product detail retains its inset facts card with a quiet border, card surface, rounded corners, and 20px padding. Text labels replace decorative price/category/date/region icons; back/source icons retain their directional role. Labels use a content-sized column, leaving remaining width for real region names. The price is 24px / 1.4 at weight 500 with tabular numerals. Values, badges, tax labels, and source information remain unchanged.

## Per-field localized retailer content (#16)

`resolveProductText` resolves each title/description independently, trims empty fields, and returns text plus the actual language and fallback status. The approved order is en → ja → zh, ja → en → zh, or zh → ja → en. Cards and full detail show a quiet localized “Shown in …” note for each field that falls back, with a matching HTML language tag. Empty descriptions stay absent. A translated title never forces its description or the interface to change language. Retailer content is neither generated nor retransformed. Modal accessible titles use the same resolver. Japanese source subtitles remain where they add distinct source text.

## Responsive product images (#86)

Catalog and full-detail images retain their existing aspect-ratio canvases, contained photography, loading/error state and eager/lazy priorities. They now supply a finite width srcset (320/480/640/768/960/1280/1600) to the existing image route. Catalog sizes follow the 600/800px column breakpoints; full detail supplies its 1024px column split. Gallery images stay lazy. Source product records and original retailer references are unchanged.

The server-only Sharp pipeline emits WebP at quality 80, preserves aspect ratio, caps both dimensions at the selected width, and never enlarges a source. The route accepts only the four observed HTTPS retailer image hosts, validates every redirect, and restricts sizes. Unsupported or failed images use the existing unavailable state. See the image-delivery evidence for resource, cache, runtime and performance limits.


### Native image paint before hydration

Product photos paint as soon as the browser decodes them; loaded state no longer controls image opacity. Positioned images paint above the preceding loading label, while release badges and Safari navigation feedback retain their ordering. The label remains until the normal image load handler updates React state; failed and missing images retain their existing fallback. Transparent transformed sources are composited onto the same white canvas used in both themes so loading text cannot show through a decoded image. The original-byte URL is unchanged. Reserved geometry, priorities and view-transition identities remain intact.


### Image transport boundary

Nitro handles `/api/image` before the React SSR catch-all. Its native server adapter accepts GET/HEAD, rejects other methods before loading the processor, and imports the bounded image pipeline on demand. Do not reintroduce a TanStack UI-route handler for this endpoint: image requests must not load the React/router dependency graph. The compiled isolation check in Web CI exercises invalid input and a real native WebP transform with a local fixture and no external fetch. Existing URL, source/redirect validation, admission, byte/pixel/time, cache and fallback contracts remain.

## Product sharing metadata (#27)

The root head reads the already-fetched detail product from the request’s query
cache when the standalone product route matches. No second fetch or extra product
loader payload is required. The root owns the single set of description/Open Graph/Twitter
metadata and the document title; product routes do not append competing tags.
`productSharing` is exported by the products entrypoint and uses the same
per-field locale fallback order as cards/detail. Missing descriptions use the
localized site description; unavailable products use site metadata.

Sharing image URLs use the request’s serialized origin, independently of the
configured canonical origin, so immutable previews serve their own images. They use an absolute `/api/share-image?url=…` URL for the first allowed
retailer photograph. This native Nitro handler reuses the existing image source,
redirect, download, decode, time, pixel, admission and cache bounds and emits a
JPEG within 1280×1280 without cropping or enlargement. It falls back via an
uncached redirect to `/share-default.jpg` on unavailable/invalid images. Only
the known 1200×630 static fallback declares dimensions; product dimensions are
not invented. Ordinary `/api/image` WebP/original behavior remains as documented.
The fallback uses the current icon and existing light theme tokens; regenerate
with `node scripts/generate-share-fallback.mjs` after an intentional brand change.

Canonical and Open Graph URLs retain the existing query-free product path.
Platform recrawling/cache behavior and actual Instagram rendering require
post-release verification; metadata does not force old messages to refresh.

## Product sharing dialog (#27)

`ProductShareAction` is shared by modal and standalone details. The neutral Share
product trigger opens a centered native modal, up to 640px wide with 16px viewport
clearance. It uses a title/Close row, a horizontally scrollable destination strip,
and an always-visible clean URL field beside Copy link, following the maintainer's
YouTube reference. Platform actions use 60px circular brand marks with names below;
Facebook, WhatsApp, X and LinkedIn marks are vendored CC0 Simple Icons paths with
pinned source provenance in `share-brand-paths.ts`. Utility icons remain Lucide.
No social SDK or remote icon request is used.

Facebook/X/WhatsApp/LinkedIn open encoded external composers; Email uses an encoded mailto
subject/body. The maintainer removed the Instagram shortcut because it duplicated Copy link.
The URL/Copy row serves Instagram and any other destination. More apps appears when native sharing is available. The
website cannot choose which apps the device offers. Destination arrows appear
when the row overflows; touch scrolling and Tab also reveal off-screen options.
Arrow scrolling is immediate. At an edge, focus moves to the revealed destination
instead of disappearing with its navigation arrow.

Every destination uses the current serving origin, product path, and selected
`lang` only. Search, filter, limit, and pagination stay in the browsing URL. The
read-only URL is selectable before any clipboard request. Copy success swaps the
copy icon to a check and is announced; denial keeps that field available with
an explanatory error icon/text/border. Native cancellation is quiet; native share
failure falls back to copying. Copy/native actions disable while pending.

The native modal traps focus. Close, Escape, and a press/release on its backdrop
dismiss only sharing and restore trigger focus. A pre-existing product modal's
scroll lock is preserved, then closing that product still restores its catalog
state/focus. Product or language changes remount the action to clear stale data.
The dialog opens without motion, including for reduced-motion and keyboard users.

The maintainer reported a clean Chinese product link showed an Instagram preview
when the long browsing link did not. Clean links address that observed difference;
no universal parsing rule or platform preview-cache guarantee is claimed.
