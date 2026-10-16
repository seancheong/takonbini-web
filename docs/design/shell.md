# Shell components

## Header

Use [Header](../../src/components/Header.tsx) once in [the root shell](../../src/routes/__root.tsx), not separately in catalog/detail screens. It owns the home Link and theme/language controls; screens own page headings.

No props, variants or size union exist. Preserve the fixed 64px header, document-level theme, responsive logo/text, and control minimums. The root shell is its only production caller.

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

No props or variants exist. Supported values are `en`, `zh`, `ja`; fallback is the first supported value. Do not replace the project locale code `zh` with an invented value in callers. Existing Chinese copy includes mixed script; editorial localization changes belong to #27/#16. Header is its only caller.

Correct from Header: `<LanguageSelect />`. Incorrect mutation: `<LanguageSelect size="compact" />`; no such prop exists. Keep Select's visible value and aria-label rather than showing an unlabeled globe.

## ScrollTopButton

Use [ScrollTopButton](../../src/components/ScrollTopButton.tsx) for the catalog's scroll action; use a Link for navigation. This dedicated control is not a general icon-button primitive.

Styling is compiled by StyleX via `stylex.create` and `stylex.props`; it uses the typed semantic colors. No props, variants or sizes exist. It appears when `scrollY > 120`, stays bottom/right at 1.5rem, has a translated label and ArrowUp, and calls smooth scrolling unless reduced motion requests immediate scrolling. [CatalogScreen](../../src/features/products/catalog/CatalogScreen.tsx) is its only caller; motion rules are in [layout](layout.md).

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
