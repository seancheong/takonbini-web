# Shell components

## Approved catalog revamp — 17 October 2026

Header is sticky at the viewport top on layer 20, 88px high (76px compact, 56px in viewports at most 500px tall), with a 36px green octopus icon and uppercase wordmark. The catalog screen uses 42px top and 40px side padding (30px/20px compact). Theme/language controls remain provider-owned.

The compatibility-migration baseline below is retained as historical context; the approved changes above supersede its geometry and interaction restrictions.

## Header

Use [Header](../../src/components/Header.tsx) once in [the root shell](../../src/routes/__root.tsx), not separately in catalog/detail screens. It owns the home Link and theme/language controls; screens own page headings.

No props, variants or size union exist. Preserve the fixed 64px header, document-level theme, responsive logo/text, and control minimums. Document defaults reserve the scrollbar gutter so switching to a short detail page does not shift the menu sideways. The root shell is its only production caller.

Correct from the root: `<Header />`. Incorrect mutation: rendering a second `<Header />` inside CatalogScreen to obtain a different page title; use the screen heading instead.

## ThemeSelect

Use [ThemeSelect](../../src/components/ThemeSelect.tsx) to change theme; use LanguageSelect for language. Use `useTheme()` for state rather than a parallel theme picker or local storage entry.

No appearance props exist. Values are `light`, `dark`, `system`; default is provider `system`. Existing trigger has a 44px minimum height/width, hides its text below `sm`, and retains a translated aria-label. Header is its only caller.

Correct from Header: `<ThemeSelect />`. Incorrect mutation: `<ThemeSelect variant="icon" />`; its responsive icon presentation is already internal.

```text
Explicit light → light
Explicit dark → dark
Follow device preference → system (provider default)
```

## LanguageSelect

Use [LanguageSelect](../../src/components/LanguageSelect.tsx) for locale; use ThemeSelect for appearance. Read `SUPPORTED_LANGUAGES` from [i18n](../../src/i18n.ts), and keep translated labels.

No props or variants exist. Supported values are `en`, `zh`, `ja`; fallback is the first supported value. Do not replace the project locale code `zh` with an invented value in callers. The Chinese selector explicitly identifies Traditional Chinese; the document uses `zh-Hant` while URLs and translation data retain the project key `zh`. Header is its only caller.

Correct from Header: `<LanguageSelect />`. Incorrect mutation: `<LanguageSelect size="compact" />`; no such prop exists. Keep Select's visible value and aria-label rather than showing an unlabeled globe.

## ScrollTopButton

Use [ScrollTopButton](../../src/components/ScrollTopButton.tsx) for the catalog's scroll action; use a Link for navigation. This dedicated control is not a general icon-button primitive.

Styling is compiled by StyleX via `stylex.create` and `stylex.props`; it uses the typed semantic colors. No props, variants or sizes exist. It appears when `scrollY > 120` and remains visible until reaching the top, stays bottom/right at max(1.5rem, the corresponding safe-area inset) on layer 10, has a translated label and ArrowUp, and calls smooth scrolling unless reduced motion requests immediate scrolling. [CatalogScreen](../../src/features/products/catalog/CatalogScreen.tsx) is its only caller; motion rules are in [layout](layout.md).

Correct from CatalogScreen: `<ScrollTopButton />`. Incorrect mutation: `<ScrollTopButton variant="primary" />`; its primary-token surface is implemented internally, not a selectable variant.

## ThemeProvider

Use [ThemeProvider](../../src/contexts/ThemeProvider.tsx) in the root to own theme state; component appearance uses semantic variables, not separate provider instances.

Appearance inputs are `defaultTheme?: Theme` (default `system`) and `cookieKey?: string` (default `takonbini-ui-theme`); these are configuration, not component variants. Preserve the existing cookie and early initialization to avoid a theme flash or hydration differences.

Correct from the root: `<ThemeProvider defaultTheme={resolvedTheme} cookieKey={themeCookieKey}>` wrapping the shell. Incorrect mutation: a ThemeProvider around each SelectContent; the portal should inherit the document theme instead.


Header and both selectors use component-owned StyleX styles. The 640px label/logo
breakpoint, fixed 64px header and 44px shell trigger minimums are unchanged.
The document applies `themeStyles.bridge`; ThemeProvider adds/removes every
compiled class from `darkTheme` plus the legacy light/dark marker. Its early
script receives the classes as serialized data, so it has no module closure.
Portals inherit the document variables. Keep this ownership in the provider.


## Persistent controls

Header stays in document flow with sticky positioning and an opaque background. `metrics.headerHeight` owns its responsive height; the document bridge exposes it to root scroll-padding so keyboard and anchor scrolling clear the header by 16px. The document uses overflow-x: clip to avoid creating an extra scrolling ancestor. Native modals remain above the header in the top layer, and Select popup layer 50 stays above it. The product modal keeps its Close action in a sticky, zero-height bar; the filter dialog already keeps its header/footer outside the scrolling body. Catalog search/store controls remain in document flow to preserve browsing space on short screens.


Modal scroll locking belongs on document.documentElement, not body. Setting body overflow to hidden creates a scrolling ancestor for the sticky header, pulling it out of view at nonzero page scroll. Both product and filter dialogs preserve and restore the root's previous inline overflow without changing the body's overflow. Keep scrollbar-gutter stable on the root.

Theme/language popups use trigger-aligned popper positioning with 180ms entry and 120ms exit. Theme switches temporarily suppress transitions. After hydration, the back-to-top control stays mounted with native `hidden` visibility below the 120px threshold; supported browsers animate its 6px rise/fade over 150ms and exit over 110ms. Reduced motion makes visibility changes immediate. See [motion](layout.md#catalog-interaction-motion--18-october-2026).

The development-only TanStack launcher sits bottom-left so it does not cover the bottom-right back-to-top action.

Radix Select marks body with `data-scroll-locked` while open. Global CSS transfers that lock to the document root and overrides Radix's important body overflow rule with `overflow: visible`. Otherwise body becomes the sticky header's scrolling ancestor, and popper menus anchor above the viewport after scrolling. Keep this override independent of motion preferences and preserve the attribute-driven cleanup when the menu closes.

The back-to-top button uses its existing primary surface and border without an additional drop shadow. Visibility, focus, and scrolling behavior stay the same.

## Locale routing (#16)

The root owns optional `lang` search validation and retention across links, filter changes, and detail masks. Locale precedence is explicit supported URL, saved cookie, weighted supported browser preference, then English. Server rendering resolves this before route content; after hydration a missing locale is added with replace navigation and no scroll reset. Unsupported values fall through to the next source. `LanguageSelect` changes i18next immediately, saves the existing cookie, and calls `navigateLocale` to preserve search, hash, history state, and any detail URL mask. Its persistent output announces explicit changes without moving focus. Locale navigation replaces the current entry and preserves scroll; it does not close/remount a product modal. Product filters and query keys exclude locale.

The document uses English/Japanese/Traditional Chinese language tags and local script-specific font stacks. Preserve the current catalog masthead and submit-based search; the historical Weekly copy is not part of this implementation.

## Server locale ownership

Each server router owns a separate translation instance from `getRouterI18n`.
The router's `I18nextProvider`, root locale resolution, and route metadata use
that same instance. Never change the module singleton's language during SSR:
concurrent visitors can otherwise receive another request's language. Browser
routers retain the existing singleton for language detection and persistence.

## Navigation startup recovery (#94)

The root uses `RootDocument` as its `shellComponent` and Outlet as its normal
component. HTML/head/styles, ThemeProvider and Header remain outside the root
route's error boundary. Missing root loader data uses the existing system-theme
default; the provider still reads the saved browser preference. Theme/origin/site
metadata is cached for the lifetime of the router (`staleTime: Infinity`); explicit
invalidation can refresh it and each new server document reads fresh request data.

`NavigationError` is eagerly imported by the root. Its heading receives focus;
localized copy follows the URL locale, without displaying raw error details.
The owned neutral `retry` action invalidates the router for startup-request or
route-options errors. Known browser dynamic-import failures instead use one
user-triggered document reload, because browsers can cache a failed module import.
Copy explains that reload; the current public product URL and query survive, but
an unmasked reload renders standalone detail rather than preserving a modal's
in-memory pages. No reload loop or automatic online retry is added. Known offline
state announces reconnect instructions before retrying or reloading.

`NavigationPending` exposes polite Opening page feedback inside its h1 and a catalog escape
while slow retries run. In-place recovery focuses an open dialog's Close before the loaded
page heading; it does not move focus if the visitor navigated to a different URL.
A document reload uses the browser's new-document focus. The catalog h1 is programmatically focusable without entering ordinary Tab order.
Back to products is an ordinary anchor retaining the catalog search/filter/locale
query and dropping modal history state, so it can recover without the failed
client route module. Styles and actions are private to NavigationError.tsx.

For the virtual catalog, ScrollTopButton emits a cancelable scroll request so VirtualCatalog can use its own smooth-scroll coordinator; otherwise it falls back to native window scrolling. This prevents dynamic row measurement from canceling the animation. Reduced motion remains immediate.

The catalog return-to-top uses a450–900ms distance-based animation with cosine ease-in-out, rather than browser-controlled smooth timing. Row-size scroll compensation is suspended only during this animation and restored on completion, interruption or unmount. Wheel, touch, pointer and keyboard input cancel it. Reduced motion remains immediate; product/cache bounds are unchanged. This supersedes the earlier native smooth-scroll coordinator.

Automatic locale URL normalization belongs to each loaded page route, not the root shell. Its effect runs after the catalog/detail/error subtree commits hydration, so a missing lang query cannot initiate navigation while a streamed lazy page is still hydrating. Server-rendered language selection, explicit locale switching, replace-history behavior and scroll preservation remain unchanged.
