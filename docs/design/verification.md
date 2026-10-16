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
