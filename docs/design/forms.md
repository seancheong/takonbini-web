# Select and forms

## Approved catalog revamp — 17 October 2026

CatalogFilters is now an inline section spanning the catalog toolbar, with draft/apply/reset semantics. It exposes every category and region and validates whole-yen price ranges. The Filters trigger toggles the section with aria-expanded/aria-controls. ProductPreview owns the native modal; closing restores body overflow and trigger focus.

The compatibility-migration baseline below is retained as historical context; the approved changes above supersede its geometry and interaction restrictions.

## Select

Use [the existing Radix wrapper](../../src/components/ui/select.tsx) for a single choice such as theme or language. Use labeled checkboxes in CatalogFilters for multiple staged choices; Select has no search/combobox or multi-select API.

`SelectTrigger.size` is exactly `"sm" | "default"`; default is `"default"` (36px high), `sm` is 32px. These are the only size names. The theme/language callers override minimum height to 44px; preserve that touch target. There is no `variant` prop.

`SelectContent` defaults: `position="item-aligned"`, `align="center"`. Radix also supports `position="popper"` and alignment values; preserve those prop contracts instead of inventing appearance variants. Both production callers use the defaults.

Correct, extracted from [LanguageSelect](../../src/components/LanguageSelect.tsx):

```tsx
<SelectTrigger
  xstyle={styles.trigger}
  aria-label={t("language.changeLanguage")}
>
  <div {...stylex.props(layoutStyles.row)}>
    <Globe size={16} {...stylex.props(layoutStyles.icon)} />
    <SelectValue>{t(`language.${currentLanguage}`)}</SelectValue>
  </div>
</SelectTrigger>
```

Incorrect mutation: `<SelectTrigger size="icon" variant="ghost">`. Neither appearance prop is implemented.

Compose the exported parts instead of duplicating Radix markup:

| Export | Use/default or appearance input |
| --- | --- |
| `Select` | Root value/onValueChange or Radix defaultValue; no custom appearance props |
| `SelectTrigger` | Trigger size, className and xstyle, disabled/invalid/placeholder states |
| `SelectValue` | Current value/placeholder; no custom variant |
| `SelectContent` | Portalled popup; position, align, className |
| `SelectItem` | Required value; disabled and className; checked indicator is built in |
| `SelectGroup`, `SelectLabel` | Group related options; label uses muted text |
| `SelectSeparator` | Divide option groups; no variant |
| `SelectScrollUpButton`, `SelectScrollDownButton` | Internal overflow affordances, already included by Content |

Theme and language controls are the only external Select call sites. Group/label/separator exports have no current external call sites; do not invent usage evidence. Preserve Radix `data-state`, `data-side`, placeholder, disabled, invalid, focus and portal behavior in #29. Theme variables must inherit into the portal, which lives outside the trigger subtree.

Select's owned elements now use compiled StyleX styles. `SelectTrigger.xstyle` is
an optional `stylex.StyleXStyles` input; compose it after base/size styles for a
caller override. The two shell callers use it for 44px touch targets, horizontal
padding, and border suppression. Dynamic StyleX variables and native `style`
are preserved; native inline properties take precedence. Existing Radix props
and refs pass through. `className` remains supported, for caller-owned CSS; Tailwind utility merging has been removed. Use `xstyle`
for typed overrides and native `style` for runtime inline values. Do not add an appearance variant for these overrides.

SVG/value/item-text geometry is applied to owned elements and both shell callers.
Arbitrary new children must carry their own explicit styles; no global descendant
selector will size them. Preserve the documented 16px shell icons. Enter/exit and
side/popup offsets retain the existing values. Select transitions and animations
now use zero duration with reduced motion.

## Catalog search

Use [CatalogControls](../../src/features/products/catalog/CatalogControls.tsx) inside the existing catalog; use a normal navigation link to open a different page. No shared `Input` component or input size/variant API exists.

Search uses CatalogControls' private `searchForm`, `searchField`, `searchLabel`, and `searchInput` styles. It has a visible associated label, a `type="search"` input at 16px, a 44px minimum input height, and form submission. Search text is draft until submit; do not silently add debounce or live filtering in #29.

Correct, from CatalogControls:

```tsx
<label htmlFor={id}>{t("product.filters.searchLabel")}</label>
```

Incorrect mutation: replacing this label with only a placeholder. The field would lose its persistent visible name.

## CatalogFilters / ProductFilterDrawer

[CatalogFilters.tsx](../../src/features/products/catalog/CatalogFilters.tsx) currently default-exports a function named `ProductFilterDrawer`. It owns the native modal `dialog`; there is no shared `Dialog` export. Use it for staged filters; use the store picker for immediate single-store changes.

Props: `filters`, `setFilters`, `isFilterOpen`, `setIsFilterOpen`, `onApply`, `onReset`. All are required; none selects a visual variant. Closed/open comes from `isFilterOpen`, not from mounting a styled div. The parent copies applied filters into draft when opening.

Correct, from [CatalogPanel](../../src/features/products/catalog/CatalogPanel.tsx):

```tsx
setIsFilterOpen={(open) => {
  if (open) setDraftFilters(filters);
  setIsFilterOpen(open);
}}
```

Incorrect mutation: apply filters from every checkbox change. It removes the dialog's staged Apply behavior.

- Use fieldset/legend for stores, categories, regions and price. Labels wrap native checkboxes; selected appearance follows `data-selected`.
- Prices are nonnegative integers; an absent bound differs from zero. Minimum must not exceed maximum. Preserve `aria-invalid`, error descriptions, and `role="alert"`.
- Apply submits only valid draft values and closes. Reset calls `onReset`; it is not a destructive action. Escape/cancel and close must synchronize parent open state.
- Desktop dialog: max width 640px, max height `min(85dvh, 850px)`. At ≤600px it becomes a bottom sheet using the same native dialog. Keep safe-area footer padding and scrolling content.
- Preserve native modal focus containment and return-to-trigger behavior. StyleX conversion must not replace `showModal()` with CSS visibility.
