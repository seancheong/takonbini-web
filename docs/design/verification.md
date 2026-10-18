# Design documentation verification

The linked component sources are the API authority. The StyleX implementation
updates tokens, private style roles, the Select override and motion/reset owners.
No Button/IconButton, new Select size/variant, or generic utility API was added.

## Inventory

- Typed colors, dark overrides, bridge, metrics, conditions and store styles.
- All Select exports and both ThemeSelect/LanguageSelect consumers.
- Header, scroll action, ThemeProvider and the root document.
- Catalog actions, search, native filter dialog, grid/card and data states.
- Detail normal/pending/error screens and image/status behavior.
- Reset attribution and the remaining native backdrop/view-transition globals.

Every public name points to an implementation file. Private layoutStyles entries
are described by owner; another component must not import them as a public API.

## Fresh-reader probe

Repeat after API/documentation changes: ask a fresh reader to compose Reset/Apply,
the heading close action, Header language chooser and the existing 44px language
trigger override using only DESIGN.md and relevant topics. Check native semantics,
translated keys, exact callback names, closed role choices, typed tokens and
absence of invented components/utilities. Record drift and fix the docs.

The final fresh-reader probe passed on 16 October 2026 after correcting one
stale LanguageSelect example. It reproduced the native close/reset/apply roles,
translated keys, Header placement and supported 44px xstyle override without
invented APIs. Keep probes and temporary harnesses outside production routes.

## Mechanical checks

Check local Markdown links, root/topic line budgets (under 100/150), token value
mapping, and every changed example against real callers. Runtime tests, browser
parity and build checks are recorded in the full migration evidence; a docs probe
alone does not establish visual or runtime parity.

## Header menu scroll-lock regression

Browser layout check (jsdom does not calculate sticky positions): scroll the catalog at least one viewport, open each header selector by pointer, and verify the header remains at y=0 and the popup bounds remain within the viewport after its entry animation. Select a different theme/language, confirm the choice changes, and confirm page scrolling resumes at the same position. Repeat opening via keyboard and dismiss with Escape. The failing baseline had header y=-2542 and popup y=-2472.5 because Radix locked body overflow; the root-lock CSS must keep body overflow visible while open. Existing Select tests cover keyboard selection and focus restoration but cannot detect this geometry regression.

## Optimistic store filtering regression

Use a deferred navigation promise in CatalogPanel tests: click a different store and verify aria-pressed changes before resolving navigation, the existing grid remains mounted but inert, and the named loading output appears. Resolve with committed filters and verify the overlay disappears without reverting the selection. Rapid changes must preserve the latest store and other filters; resolving canceled actions without committing new filters must restore the committed selection. CatalogControls tests keep the Search label while disabled. Local browser verification confirmed a constant 52px Chinese Search button before/during refresh and a selected requested store while the overlay was still visible.

For cached filter scroll regression: browse All stores partway down, use the sticky filter dialog to choose a store, return to the top, then click All stores. The viewport must stay at the top instead of restoring the old All stores position. The route-handler test asserts resetScroll:false and the memory-router integration checks preservation when navigating to a catalog key with a different cached position, while the existing detail Back/Forward checks continue to pass.

Visual-restraint verification: inspect catalog and product preview at 1280px and 390px in light/dark themes. English, Japanese, and Chinese headings retain the system family; CJK tracking computes to normal and mobile layouts have no horizontal overflow. Check the rectangular status label, 24px detail price, text-only fact labels, and the single 1px facts rule. Preserve the original locale/theme/filter preferences after review.
