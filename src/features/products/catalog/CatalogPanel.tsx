import * as stylex from "@stylexjs/stylex";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { productsInfiniteQueryOptions } from "@/features/products/data/product-queries";
import type { ProductFilters } from "@/features/products/products.contracts";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
import { metrics } from "../../../styles/metrics.stylex";
import CatalogControls from "./CatalogControls";
import ProductFilterDrawer from "./CatalogFilters";
import ProductGrid from "./ProductGrid";
import WeeklyMasthead from "./WeeklyMasthead";

interface ProductPanelProps {
	filters: ProductFilters;
	onApply: (filters: ProductFilters) => void;
}
export default function ProductPanel({ filters, onApply }: ProductPanelProps) {
	const { t } = useTranslation();
	const [draftFilters, setDraftFilters] = useState<ProductFilters>(filters);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	useEffect(() => {
		setDraftFilters(filters);
	}, [filters]);
	const {
		data,
		isLoading,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		isFetching,
		isError,
		isFetchNextPageError,
		refetch,
	} = useInfiniteQuery(productsInfiniteQueryOptions(filters));
	const products = data?.pages.flatMap((page) => page.products) ?? [];
	const routerIsLoading = useRouterState({
		select: (state) =>
			state.isLoading &&
			state.location.pathname === "/" &&
			state.resolvedLocation?.pathname === "/",
	});
	const isRefreshing = routerIsLoading || (isFetching && !isFetchingNextPage);
	const hasFilters = Boolean(
		filters.search ||
			filters.stores?.length ||
			filters.categories?.length ||
			filters.regions?.length ||
			filters.includeSoon ||
			filters.minPrice !== undefined ||
			filters.maxPrice !== undefined,
	);
	return (
		<section {...stylex.props(layoutStyles.panel)}>
			<WeeklyMasthead />
			<CatalogControls filters={filters} onApply={onApply}>
				<ProductFilterDrawer
					filters={draftFilters}
					setFilters={setDraftFilters}
					isFilterOpen={isFilterOpen}
					setIsFilterOpen={(open) => {
						if (open) setDraftFilters(filters);
						setIsFilterOpen(open);
					}}
					onApply={onApply}
					onReset={() =>
						setDraftFilters({
							limit: filters.limit,
							search: filters.search,
						})
					}
				/>
			</CatalogControls>
			<div {...stylex.props(layoutStyles.resultsHeading)}>
				<h2 {...stylex.props(layoutStyles.resultsTitle)}>
					{t("product.results")}
				</h2>
				<output aria-live="polite" {...stylex.props(layoutStyles.count)}>
					{isLoading
						? t("product.loading")
						: data
							? t("product.loadedCount", {
									count: products.length,
								})
							: null}
				</output>
			</div>

			{isRefreshing && !isLoading ? (
				<output {...stylex.props(layoutStyles.refreshStatus)}>
					{t("product.loading")}
				</output>
			) : null}

			{isError ? (
				<div role="alert" {...stylex.props(layoutStyles.error)}>
					<p {...stylex.props(layoutStyles.errorText)}>{t("product.error")}</p>
					<button
						type="button"
						onClick={() => (isFetchNextPageError ? fetchNextPage() : refetch())}
						disabled={isFetching}
						{...stylex.props(layoutStyles.retry)}
					>
						{t("product.retry")}
					</button>
				</div>
			) : null}

			{isLoading ? (
				<div aria-busy="true" {...stylex.props(layoutStyles.grid)}>
					{["a", "b", "c", "d", "e", "f", "g", "h"].map((key) => (
						<div
							key={key}
							aria-hidden="true"
							{...stylex.props(layoutStyles.skeleton)}
						>
							<div {...stylex.props(layoutStyles.skeletonImage)} />
							<div {...stylex.props(layoutStyles.skeletonCopy)}>
								<span {...stylex.props(layoutStyles.skeletonLine)} />
								<span {...stylex.props(layoutStyles.skeletonLine)} />
								<span {...stylex.props(layoutStyles.skeletonLine)} />
							</div>
						</div>
					))}
				</div>
			) : products.length ? (
				<>
					<ProductGrid products={products} filters={filters} />

					<div {...stylex.props(layoutStyles.pagination)}>
						{hasNextPage ? (
							<button
								type="button"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
								{...stylex.props(layoutStyles.loadMore)}
							>
								{isFetchingNextPage
									? t("product.loadingMore")
									: t("product.loadMore")}
							</button>
						) : (
							<span {...stylex.props(layoutStyles.refreshStatus)}>
								{t("product.end")}
							</span>
						)}
					</div>
				</>
			) : !isError ? (
				<div {...stylex.props(layoutStyles.empty)}>
					<p {...stylex.props(layoutStyles.refreshStatus)}>
						{t(hasFilters ? "product.noMatches" : "product.empty")}
					</p>
					{hasFilters ? (
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
					) : null}
				</div>
			) : null}
			<p {...stylex.props(layoutStyles.availability)}>
				{t("product.availabilityNote")}
			</p>
		</section>
	);
}
const layoutStyles = stylex.create({
	panel: {
		marginLeft: "auto",
		marginRight: "auto",
		width: "100%",
		maxWidth: "72rem",
		display: "flex",
		flexDirection: "column",
		gap: "1.75rem",
	},
	resultsHeading: {
		display: "flex",
		flexWrap: "wrap",
		justifyContent: "space-between",
		alignItems: "baseline",
		gap: "1rem",
		paddingTop: "1rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: colors.border,
	},
	resultsTitle: {
		fontSize: "1.2rem",
		fontWeight: 650,
	},
	count: {
		color: colors.mutedForeground,
		fontSize: "0.8rem",
		fontVariantNumeric: "tabular-nums",
	},
	refreshStatus: {
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		color: colors.mutedForeground,
	},
	error: {
		borderRadius: "calc(var(--radius) + 4px)",
		borderTopWidth: "1px",
		borderRightWidth: "1px",
		borderBottomWidth: "1px",
		borderLeftWidth: "1px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: "color-mix(in oklab, var(--destructive) 30%, transparent)",
		borderRightColor:
			"color-mix(in oklab, var(--destructive) 30%, transparent)",
		borderBottomColor:
			"color-mix(in oklab, var(--destructive) 30%, transparent)",
		borderLeftColor: "color-mix(in oklab, var(--destructive) 30%, transparent)",
		backgroundColor: colors.card,
		paddingTop: "1.5rem",
		paddingRight: "1.5rem",
		paddingBottom: "1.5rem",
		paddingLeft: "1.5rem",
	},
	errorText: {
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		color: colors.foreground,
	},
	retry: {
		marginTop: "1rem",
		minHeight: "2.75rem",
		borderRadius: "var(--radius)",
		borderTopWidth: "1px",
		borderRightWidth: "1px",
		borderBottomWidth: "1px",
		borderLeftWidth: "1px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: colors.border,
		borderRightColor: colors.border,
		borderBottomColor: colors.border,
		borderLeftColor: colors.border,
		paddingLeft: "1rem",
		paddingRight: "1rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		fontWeight: 600,
		backgroundColor: {
			default: null,
			":hover": colors.muted,
		},
		outlineWidth: {
			default: null,
			":focus-visible": "2px",
		},
		outlineStyle: {
			default: null,
			":focus-visible": "solid",
		},
		outlineColor: {
			default: null,
			":focus-visible": colors.ring,
		},
		opacity: {
			default: null,
			":disabled": 0.6,
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
	grid: {
		display: "grid",
		gridTemplateColumns: {
			default: "repeat(2, minmax(0, 1fr))",
			[conditions.tabletGrid]: "repeat(3, minmax(0, 1fr))",
			[conditions.desktopGrid]: "repeat(4, minmax(0, 1fr))",
		},
		gap: {
			default: "1.5rem 1rem",
			[conditions.compactCatalog]: "1rem 0.65rem",
		},
	},
	skeleton: {
		overflow: "hidden",
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
		backgroundColor: colors.card,
	},
	skeletonImage: {
		aspectRatio: "1",
		backgroundColor: colors.muted,
	},
	skeletonCopy: {
		paddingTop: "1rem",
		paddingRight: "1rem",
		paddingBottom: "1rem",
		paddingLeft: "1rem",
		display: "grid",
		gap: "1rem",
	},
	skeletonLine: {
		display: "block",
		height: "0.8rem",
		backgroundColor: colors.muted,
		borderRadius: "0.2rem",
		width: {
			default: null,
			":first-child": "45%",
			":last-child": "65%",
		},
	},
	pagination: {
		display: "flex",
		justifyContent: "center",
		paddingTop: "1rem",
		paddingRight: "0",
		paddingBottom: "1rem",
		paddingLeft: "0",
	},
	loadMore: {
		minHeight: "44px",
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "0.5rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderRadius: metrics.actionRadius,
		backgroundColor: {
			default: colors.card,
			":hover": colors.muted,
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
	empty: {
		borderRadius: "calc(var(--radius) + 4px)",
		borderTopWidth: "1px",
		borderRightWidth: "1px",
		borderBottomWidth: "1px",
		borderLeftWidth: "1px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderRightColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderBottomColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderLeftColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		backgroundColor: colors.card,
		paddingTop: "2rem",
		paddingRight: "2rem",
		paddingBottom: "2rem",
		paddingLeft: "2rem",
		textAlign: "center",
	},
	clearFilters: {
		marginTop: "1rem",
		minHeight: "2.75rem",
		borderRadius: "var(--radius)",
		borderTopWidth: "1px",
		borderRightWidth: "1px",
		borderBottomWidth: "1px",
		borderLeftWidth: "1px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: colors.border,
		borderRightColor: colors.border,
		borderBottomColor: colors.border,
		borderLeftColor: colors.border,
		paddingLeft: "1rem",
		paddingRight: "1rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		fontWeight: 600,
		backgroundColor: {
			default: null,
			":hover": colors.muted,
		},
		outlineWidth: {
			default: null,
			":focus-visible": "2px",
		},
		outlineStyle: {
			default: null,
			":focus-visible": "solid",
		},
		outlineColor: {
			default: null,
			":focus-visible": colors.ring,
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
	availability: {
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: colors.border,
		paddingTop: "1.25rem",
		paddingRight: "0",
		paddingBottom: "1.25rem",
		paddingLeft: "0",
		fontSize: "0.8rem",
		lineHeight: 1.6,
		color: colors.mutedForeground,
	},
});
