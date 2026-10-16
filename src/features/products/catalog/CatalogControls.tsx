import * as stylex from "@stylexjs/stylex";
import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Store } from "@/features/products/model/product-values";
import type { ProductFilters } from "@/features/products/products.contracts";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
import { metrics } from "../../../styles/metrics.stylex";
import {
	categoryLabelKeys,
	regionLabelKeys,
	storeLabelKeys,
} from "../model/product-labels";

interface CatalogControlsProps {
	filters: ProductFilters;
	onApply: (filters: ProductFilters) => void;
	children: React.ReactNode;
}
export default function CatalogControls({
	filters,
	onApply,
	children,
}: CatalogControlsProps) {
	const { t } = useTranslation();
	const id = useId();
	const [search, setSearch] = useState(filters.search ?? "");
	useEffect(() => setSearch(filters.search ?? ""), [filters.search]);
	const chips: {
		id: string;
		label: string;
		remove: () => void;
	}[] = [];
	if (filters.search)
		chips.push({
			id: "search",
			label: filters.search,
			remove: () =>
				onApply({
					...filters,
					search: undefined,
				}),
		});
	for (const store of filters.stores ?? [])
		chips.push({
			id: store,
			label: t(storeLabelKeys[store]),
			remove: () =>
				onApply({
					...filters,
					stores: filters.stores?.filter((value) => value !== store),
				}),
		});
	for (const category of filters.categories ?? [])
		chips.push({
			id: category,
			label: t(categoryLabelKeys[category]),
			remove: () =>
				onApply({
					...filters,
					categories: filters.categories?.filter((value) => value !== category),
				}),
		});
	for (const region of filters.regions ?? [])
		chips.push({
			id: region,
			label: t(regionLabelKeys[region]),
			remove: () =>
				onApply({
					...filters,
					regions: filters.regions?.filter((value) => value !== region),
				}),
		});
	for (const field of ["minPrice", "maxPrice"] as const)
		if (filters[field] !== undefined)
			chips.push({
				id: field,
				label: `${t(`product.filters.${field}`)}: ¥${filters[field]}`,
				remove: () =>
					onApply({
						...filters,
						[field]: undefined,
					}),
			});
	if (filters.includeSoon)
		chips.push({
			id: "soon",
			label: t("product.filters.includeSoon"),
			remove: () =>
				onApply({
					...filters,
					includeSoon: undefined,
				}),
		});
	return (
		<div>
			<div {...stylex.props(layoutStyles.toolbar)}>
				<search {...stylex.props(layoutStyles.searchSlot)}>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							onApply({
								...filters,
								search: search.trim() || undefined,
							});
						}}
						{...stylex.props(layoutStyles.searchForm)}
					>
						<label htmlFor={id} {...stylex.props(layoutStyles.searchLabel)}>
							{t("product.filters.searchLabel")}
						</label>
						<div {...stylex.props(layoutStyles.searchField)}>
							<Search
								size={20}
								aria-hidden="true"
								{...stylex.props(layoutStyles.searchIcon)}
							/>
							<input
								id={id}
								type="search"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder={t("product.filters.searchPlaceholder")}
								{...stylex.props(layoutStyles.searchInput)}
							/>
							<button
								type="submit"
								{...stylex.props(layoutStyles.searchSubmit)}
							>
								{t("product.filters.searchLabel")}
							</button>
						</div>
					</form>
				</search>
				{children}
			</div>
			<fieldset {...stylex.props(layoutStyles.storePicker)}>
				<legend {...stylex.props(layoutStyles.visuallyHidden)}>
					{t("product.filters.stores")}
				</legend>
				<button
					type="button"
					aria-pressed={!filters.stores?.length}
					onClick={() =>
						onApply({
							...filters,
							stores: undefined,
						})
					}
					{...stylex.props(layoutStyles.storeChoice)}
				>
					{t("product.allStores")}
				</button>
				{Object.values(Store).map((store) => (
					<button
						key={store}
						type="button"
						data-store={store}
						aria-pressed={filters.stores?.includes(store) ?? false}
						onClick={() =>
							onApply({
								...filters,
								stores: [store],
							})
						}
						{...stylex.props(layoutStyles.storeChoice)}
					>
						{t(storeLabelKeys[store])}
					</button>
				))}
			</fieldset>
			{chips.length ? (
				<div {...stylex.props(layoutStyles.applied)}>
					{chips.map((chip) => (
						<button
							type="button"
							key={chip.id}
							aria-label={t("product.removeFilter", {
								label: chip.label,
							})}
							onClick={chip.remove}
							{...stylex.props(layoutStyles.filterChip)}
						>
							{chip.label}
							<X
								size={14}
								aria-hidden="true"
								{...stylex.props(layoutStyles.chipIcon)}
							/>
						</button>
					))}
					<button
						type="button"
						onClick={() =>
							onApply({
								limit: filters.limit,
							})
						}
						{...stylex.props(layoutStyles.clearFilters)}
					>
						{t("product.clearFilters")}
					</button>
				</div>
			) : null}
		</div>
	);
}
const layoutStyles = stylex.create({
	toolbar: {
		display: "flex",
		alignItems: "end",
		gap: {
			default: "1rem",
			[conditions.compactCatalog]: "0.75rem",
		},
		flexWrap: {
			default: null,
			[conditions.compactCatalog]: "wrap",
		},
	},
	searchSlot: {
		flex: 1,
		minWidth: "0",
		flexBasis: {
			default: null,
			[conditions.compactCatalog]: "100%",
		},
	},
	searchForm: {
		flex: 1,
		minWidth: "0",
	},
	searchLabel: {
		display: "block",
		marginBottom: "0.5rem",
		fontSize: "0.75rem",
		fontWeight: 650,
	},
	searchField: {
		display: "flex",
		alignItems: "center",
		gap: "0.75rem",
		backgroundColor: colors.card,
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: colors.border,
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: colors.border,
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: colors.border,
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: colors.border,
		borderRadius: metrics.cardRadius,
		paddingTop: "0.3rem",
		paddingRight: "0.3rem",
		paddingBottom: "0.3rem",
		paddingLeft: "0.9rem",
		outline: {
			default: null,
			":focus-within": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-within": "2px",
		},
	},
	searchIcon: {
		flexShrink: 0,
		color: colors.mutedForeground,
	},
	searchInput: {
		width: "100%",
		minWidth: "0",
		minHeight: "44px",
		fontSize: "1rem",
		backgroundColor: "transparent",
		outline: "none",
	},
	searchSubmit: {
		minHeight: "44px",
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "0.5rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: colors.foreground,
			":hover": colors.mutedForeground,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: colors.foreground,
			":hover": colors.mutedForeground,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: colors.foreground,
			":hover": colors.mutedForeground,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: colors.foreground,
			":hover": colors.mutedForeground,
		},
		borderRadius: metrics.actionRadius,
		backgroundColor: {
			default: colors.foreground,
			":hover": "color-mix(in oklch, var(--foreground) 85%, var(--background))",
			":active": colors.accent,
		},
		paddingTop: "0.65rem",
		paddingRight: "1rem",
		paddingBottom: "0.65rem",
		paddingLeft: "1rem",
		fontSize: "0.85rem",
		fontWeight: 600,
		whiteSpace: "nowrap",
		transitionProperty: {
			default: "background-color, border-color",
			[conditions.reducedMotion]: "none",
		},
		transitionDuration: "150ms, 150ms",
		transitionTimingFunction: "ease",
		opacity: {
			default: null,
			":disabled": 0.5,
		},
		color: colors.background,
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
		animationName: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
	storePicker: {
		display: "flex",
		flexWrap: "wrap",
		gap: "0.5rem",
		marginTop: "1rem",
	},
	visuallyHidden: {
		position: "absolute",
		width: "1px",
		height: "1px",
		padding: 0,
		margin: "-1px",
		overflow: "hidden",
		clip: "rect(0, 0, 0, 0)",
		whiteSpace: "nowrap",
		borderTopWidth: 0,
		borderRightWidth: 0,
		borderBottomWidth: 0,
		borderLeftWidth: 0,
	},
	storeChoice: {
		minHeight: "44px",
		paddingTop: "0.6rem",
		paddingRight: "1rem",
		paddingBottom: "0.6rem",
		paddingLeft: "1rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: null,
			":hover": colors.mutedForeground,
			':is([aria-pressed="true"])': colors.foreground,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: null,
			":hover": colors.mutedForeground,
			':is([aria-pressed="true"])': colors.foreground,
		},
		borderBottomWidth: {
			default: "1px",
			':is([data-store="SevenEleven"])': "3px",
			':is([data-store="Lawson"])': "3px",
			':is([data-store="FamilyMart"])': "3px",
		},
		borderBottomStyle: {
			default: "solid",
			':is([data-store="SevenEleven"])': "solid",
			':is([data-store="Lawson"])': "solid",
			':is([data-store="FamilyMart"])': "solid",
		},
		borderBottomColor: {
			default: null,
			":hover": colors.mutedForeground,
			':is([aria-pressed="true"])': colors.foreground,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: null,
			":hover": colors.mutedForeground,
			':is([aria-pressed="true"])': colors.foreground,
		},
		borderRadius: metrics.actionRadius,
		fontSize: "0.85rem",
		backgroundColor: {
			default: colors.card,
			':is([aria-pressed="true"])': colors.foreground,
		},
		color: {
			default: null,
			':is([aria-pressed="true"])': colors.background,
		},
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
	},
	applied: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		gap: "0.5rem",
		marginTop: "1rem",
	},
	filterChip: {
		display: "inline-flex",
		alignItems: "center",
		gap: "0.5rem",
		minHeight: "44px",
		paddingTop: "0.5rem",
		paddingRight: "0.75rem",
		paddingBottom: "0.5rem",
		paddingLeft: "0.75rem",
		fontSize: "0.75rem",
		backgroundColor: colors.muted,
		borderRadius: "0.3rem",
		overflowWrap: "anywhere",
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
	},
	chipIcon: {
		flexShrink: 0,
	},
	clearFilters: {
		display: "inline-flex",
		alignItems: "center",
		gap: "0.5rem",
		minHeight: "44px",
		paddingTop: "0.5rem",
		paddingRight: "0.75rem",
		paddingBottom: "0.5rem",
		paddingLeft: "0.75rem",
		fontSize: "0.75rem",
		backgroundColor: "transparent",
		borderRadius: "0.3rem",
		overflowWrap: "anywhere",
		textDecoration: "underline",
		textUnderlineOffset: "3px",
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
	},
});
