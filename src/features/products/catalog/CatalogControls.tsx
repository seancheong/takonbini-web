import * as stylex from "@stylexjs/stylex";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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
	isPending?: boolean;
	onOpenFilters?: () => void;
}
export default function CatalogControls({
	filters,
	onApply,
	children,
	isPending = false,
	onOpenFilters,
}: CatalogControlsProps) {
	const { t } = useTranslation();
	const id = useId();
	const controls = useRef<HTMLDivElement>(null);
	const [showSticky, setShowSticky] = useState(false);
	useEffect(() => {
		if (!onOpenFilters || typeof IntersectionObserver === "undefined") return;
		let observer: IntersectionObserver;
		const observe = () => {
			observer?.disconnect();
			const headerHeight =
				document
					.querySelector('[data-slot="app-header"]')
					?.getBoundingClientRect().height ?? 0;
			observer = new IntersectionObserver(
				([entry]) => {
					setShowSticky(
						!entry.isIntersecting &&
							entry.boundingClientRect.bottom <= headerHeight,
					);
				},
				{ rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 },
			);
			if (controls.current) observer.observe(controls.current);
		};
		observe();
		window.addEventListener("resize", observe);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", observe);
		};
	}, [onOpenFilters]);
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
	const activeCount = chips.filter((chip) => chip.id !== "search").length;
	return (
		<div ref={controls} {...stylex.props(layoutStyles.controls)}>
			<div {...stylex.props(layoutStyles.toolbar)}>
				<search {...stylex.props(layoutStyles.searchSlot)}>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							if (isPending) return;
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
							<label
								htmlFor={id}
								{...stylex.props(layoutStyles.searchIconLabel)}
							>
								<Search
									size={20}
									aria-hidden="true"
									{...stylex.props(layoutStyles.searchIcon)}
								/>
							</label>
							<input
								id={id}
								type="search"
								autoComplete="off"
								spellCheck={false}
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder={t("product.filters.searchPlaceholder")}
								{...stylex.props(layoutStyles.searchInput)}
							/>
							<button
								type="submit"
								disabled={isPending}
								aria-busy={isPending}
								data-slot="catalog-submit"
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
						<span
							aria-hidden="true"
							{...stylex.props(layoutStyles.storeDot, storeDotStyles[store])}
						/>
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

			{showSticky && onOpenFilters && (
				<section
					aria-label={t("product.filters.appliedFilters")}
					data-slot="sticky-filters"
					{...stylex.props(layoutStyles.sticky)}
				>
					<div {...stylex.props(layoutStyles.stickyInner)}>
						<button
							type="button"
							onClick={onOpenFilters}
							aria-haspopup="dialog"
							aria-label={
								activeCount
									? `${t("product.filters.title")}, ${t("product.filters.activeCount", { count: activeCount })}`
									: t("product.filters.title")
							}
							{...stylex.props(layoutStyles.stickyOpen)}
						>
							<SlidersHorizontal size={16} aria-hidden="true" />
							{t("product.filters.title")}
							{activeCount > 0 && (
								<span {...stylex.props(layoutStyles.stickyCount)}>
									{activeCount}
								</span>
							)}
						</button>
						<div {...stylex.props(layoutStyles.stickyChips)}>
							{chips.length ? (
								chips.map((chip) => (
									<button
										key={chip.id}
										type="button"
										aria-label={t("product.removeFilter", {
											label: chip.label,
										})}
										onClick={chip.remove}
										{...stylex.props(
											layoutStyles.filterChip,
											layoutStyles.stickyChip,
										)}
									>
										{chip.label}
										<X size={14} aria-hidden="true" />
									</button>
								))
							) : (
								<span {...stylex.props(layoutStyles.stickyEmpty)}>
									{t("product.filters.noFilters")}
								</span>
							)}
						</div>
						<button
							type="button"
							onClick={onOpenFilters}
							title={chips.map((chip) => chip.label).join(" · ")}
							{...stylex.props(layoutStyles.stickySummary)}
						>
							{chips.length
								? chips.map((chip) => chip.label).join(" · ")
								: t("product.filters.noFilters")}
						</button>
					</div>
				</section>
			)}
		</div>
	);
}
const storeDotStyles = stylex.create({
	SevenEleven: { backgroundColor: colors.storeSeven },
	Lawson: { backgroundColor: colors.storeLawson },
	FamilyMart: { backgroundColor: colors.storeFamily },
});
const layoutStyles = stylex.create({
	sticky: {
		position: "fixed",
		top: metrics.headerHeight,
		insetInline: 0,
		zIndex: 19,
		backgroundColor: colors.background,
		color: colors.foreground,
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: colors.border,
		paddingInline: { default: "40px", [conditions.compactCatalog]: "20px" },
	},
	stickyInner: {
		maxWidth: "1200px",
		marginInline: "auto",
		display: "flex",
		alignItems: "center",
		gap: "16px",
		height: "64px",
	},
	stickyOpen: {
		display: "inline-flex",
		alignItems: "center",
		gap: "8px",
		flexShrink: 0,
		minHeight: "44px",
		paddingInline: "12px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		backgroundColor: { default: colors.card, ":hover": colors.secondary },
		color: colors.foreground,
		borderRadius: "4px",
		fontSize: "14px",
		fontWeight: 500,
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
	},
	stickyCount: {
		fontSize: "12px",
		fontVariantNumeric: "tabular-nums",
		color: colors.mutedForeground,
	},
	stickyChips: {
		display: { default: "flex", [conditions.compactCatalog]: "none" },
		gap: "8px",
		alignItems: "center",
		minWidth: 0,
		overflowX: "auto",
		padding: "4px",
		flex: 1,
	},
	stickyChip: { flexShrink: 0, whiteSpace: "nowrap" },
	stickyEmpty: { fontSize: "13px", color: colors.mutedForeground },
	stickySummary: {
		display: { default: "none", [conditions.compactCatalog]: "block" },
		minHeight: "44px",
		minWidth: 0,
		flex: 1,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
		textAlign: "start",
		fontSize: "13px",
		color: colors.mutedForeground,
		backgroundColor: "transparent",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
	},
	controls: {
		display: "flex",
		flexDirection: "column",
		gap: "16px",
	},
	storeDot: { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0 },
	toolbar: {
		display: "grid",
		gridTemplateColumns: {
			default: "minmax(0,1fr) auto",
			[conditions.compactCatalog]: "minmax(0,1fr)",
		},
		gap: "16px",
		alignItems: "end",
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
		fontSize: "14px",
		fontWeight: 600,
		marginBottom: "8px",
	},
	searchIconLabel: {
		position: "absolute",
		insetInlineStart: "14px",
		top: "50%",
		transform: "translateY(-50%)",
		display: "flex",
		cursor: "text",
	},
	searchField: {
		position: "relative",
		height: "56px",
		boxSizing: "border-box",
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
		paddingLeft: "44px",
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
		flex: "1 1 0%",
		width: "100%",
		minWidth: "0",
		minHeight: "44px",
		fontSize: "1rem",
		backgroundColor: "transparent",
		outline: "none",
	},
	searchSubmit: {
		flexShrink: 0,
		whiteSpace: "nowrap",
		lineHeight: 1.4,
		minHeight: "44px",
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		padding: "8px 12px",
		borderRadius: "4px",
		backgroundColor: {
			default: colors.primary,
			":hover": "color-mix(in oklch,var(--primary) 88%,var(--foreground))",
		},
		color: colors.primaryForeground,
		fontSize: "14px",
		fontWeight: 500,
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
	},
	storePicker: {
		display: "flex",
		flexWrap: "wrap",
		gap: "0.5rem",
		marginTop: 0,
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
		display: "inline-flex",
		alignItems: "center",
		gap: "8px",
		minHeight: "44px",
		padding: "0 16px",
		border: "1px solid",
		borderColor: {
			default: "transparent",
			":hover": colors.mutedForeground,
			':is([aria-pressed="true"])': colors.border,
		},
		borderRadius: "3px",
		fontSize: "14px",
		fontWeight: 500,
		backgroundColor: {
			default: "transparent",
			':is([aria-pressed="true"])': colors.card,
		},
		color: {
			default: colors.mutedForeground,
			':is([aria-pressed="true"])': colors.foreground,
		},
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
	},
	applied: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		gap: "0.5rem",
		marginTop: 0,
		paddingTop: "16px",
		borderTop: "1px solid",
		borderTopColor: colors.border,
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
		fontSize: "14px",
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
		fontSize: "14px",
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
