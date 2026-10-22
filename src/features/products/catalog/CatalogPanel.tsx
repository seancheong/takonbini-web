import * as stylex from "@stylexjs/stylex";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import {
	useCallback,
	useEffect,
	useOptimistic,
	useRef,
	useState,
	useTransition,
} from "react";
import { useTranslation } from "react-i18next";
import { productsInfiniteQueryOptions } from "@/features/products/data/product-queries";
import type {
	ActiveCatalogProduct,
	ProductFilters,
} from "@/features/products/products.contracts";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
import { metrics } from "../../../styles/metrics.stylex";
import CatalogControls from "./CatalogControls";
import ProductFilterDrawer from "./CatalogFilters";
import { catalogWindowKey } from "./catalog-window";
import ProductPreview from "./ProductPreview";
import VirtualCatalog from "./VirtualCatalog";

interface ProductPanelProps {
	filters: ProductFilters;
	onApply: (filters: ProductFilters) => void | Promise<void>;
}
export default function ProductPanel({ filters, onApply }: ProductPanelProps) {
	const { t } = useTranslation();
	const router = useRouter();
	const [optimisticFilters, setOptimisticFilters] = useOptimistic(filters);
	const [isApplying, startTransition] = useTransition();
	const applyFilters = (next: ProductFilters) => {
		startTransition(async () => {
			setOptimisticFilters(next);
			await onApply(next);
		});
	};
	const selectedId = useRouterState({
		select: (state) => state.location.state.productModalId,
	});
	const catalogEntryKey = useRouterState({
		select: (state) => state.location.state.__TSR_key,
	});
	const panel = useRef<HTMLElement>(null);
	const previewReturnId = useRef<string | undefined>(undefined);
	const previewProduct = useRef<ActiveCatalogProduct | undefined>(undefined);
	const [draftFilters, setDraftFilters] = useState<ProductFilters>(filters);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const openFilters = useCallback(() => {
		setDraftFilters(optimisticFilters);
		setIsFilterOpen(true);
	}, [optimisticFilters]);
	useEffect(() => {
		setDraftFilters(filters);
	}, [filters]);
	const {
		data,
		isLoading,
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
	const isRefreshing =
		isApplying || routerIsLoading || (isFetching && !isFetchingNextPage);
	useEffect(() => {
		if (selectedId) {
			previewReturnId.current = selectedId;
			return;
		}
		if (!previewReturnId.current || isRefreshing || isLoading) return;
		const productId = previewReturnId.current;
		previewReturnId.current = undefined;
		previewProduct.current = undefined;
		if (document.activeElement !== document.body || !panel.current) return;
		const card = [
			...panel.current.querySelectorAll<HTMLAnchorElement>(
				"a[data-product-id]",
			),
		].find((link) => link.dataset.productId === productId);
		(card ?? panel.current.querySelector<HTMLElement>("h1"))?.focus({
			preventScroll: true,
		});
	}, [selectedId, isRefreshing, isLoading]);
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
		<section ref={panel} {...stylex.props(layoutStyles.panel)}>
			<header {...stylex.props(layoutStyles.heading)}>
				<div>
					<h1 tabIndex={-1} {...stylex.props(layoutStyles.heroTitle)}>
						{t("product.title")}
					</h1>
				</div>
				<p {...stylex.props(layoutStyles.intro)}>{t("product.subtitle")}</p>
			</header>
			<CatalogControls
				filters={optimisticFilters}
				onApply={applyFilters}
				isPending={isRefreshing}
				onOpenFilters={openFilters}
			>
				<ProductFilterDrawer
					filters={draftFilters}
					activeCount={
						(optimisticFilters.stores?.length ?? 0) +
						(optimisticFilters.categories?.length ?? 0) +
						(optimisticFilters.regions?.length ?? 0) +
						Number(optimisticFilters.minPrice !== undefined) +
						Number(optimisticFilters.maxPrice !== undefined) +
						Number(!!optimisticFilters.includeSoon)
					}
					setFilters={setDraftFilters}
					isFilterOpen={isFilterOpen}
					setIsFilterOpen={(open) => {
						if (open) setDraftFilters(optimisticFilters);
						setIsFilterOpen(open);
					}}
					onApply={applyFilters}
					onReset={() =>
						setDraftFilters({
							limit: filters.limit,
							search: filters.search,
						})
					}
				/>
			</CatalogControls>
			<div {...stylex.props(layoutStyles.resultsRegion)}>
				<div
					aria-busy={isRefreshing}
					inert={isRefreshing && !isLoading}
					{...stylex.props(layoutStyles.resultsContent)}
				>
					{isLoading || !data?.pages[0]?.products.length ? (
						<div {...stylex.props(layoutStyles.resultsHeading)}>
							<h2 {...stylex.props(layoutStyles.resultsTitle)}>
								{t("product.results")}
							</h2>
							<output aria-live="polite" {...stylex.props(layoutStyles.count)}>
								{isLoading ? t("product.loading") : null}
							</output>
						</div>
					) : null}

					{isError ? (
						<div role="alert" {...stylex.props(layoutStyles.error)}>
							<p {...stylex.props(layoutStyles.errorText)}>
								{t("product.error")}
							</p>
							<button
								type="button"
								onClick={() =>
									isFetchNextPageError ? fetchNextPage() : refetch()
								}
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
					) : data?.pages[0]?.products.length ? (
						<VirtualCatalog
							key={catalogWindowKey(filters)}
							firstPage={data.pages[0]}
							entryKey={selectedId ? undefined : catalogEntryKey}
							paused={Boolean(selectedId) || isFilterOpen || isRefreshing}
							filters={filters}
							onPreview={(product) => {
								previewProduct.current = product;
								router.navigate({
									to: "/",
									search: true,
									state: (previous) => ({
										...previous,
										productModalId: product.id,
									}),
									mask: {
										to: "/products/$id",
										params: { id: product.id },
										search: filters,
										unmaskOnReload: true,
									},
									resetScroll: false,
								});
							}}
						/>
					) : !isError ? (
						<div {...stylex.props(layoutStyles.empty)}>
							<p {...stylex.props(layoutStyles.refreshStatus)}>
								{t(hasFilters ? "product.noMatches" : "product.empty")}
							</p>
							{hasFilters ? (
								<button
									type="button"
									onClick={() =>
										applyFilters({
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
				</div>
				{isRefreshing && !isLoading && (
					<div
						data-slot="catalog-loading-overlay"
						{...stylex.props(layoutStyles.loadingOverlay)}
					>
						<div {...stylex.props(layoutStyles.loadingScrim)} />
						<output
							aria-label={t("product.loading")}
							{...stylex.props(layoutStyles.loadingStatus)}
						>
							<LoaderCircle
								size={18}
								aria-hidden="true"
								{...stylex.props(layoutStyles.loadingSpinner)}
							/>
							{t("product.loading")}
						</output>
					</div>
				)}
			</div>
			{selectedId && (
				<ProductPreview
					product={
						products.find((product) => product.id === selectedId) ??
						(previewProduct.current?.id === selectedId
							? previewProduct.current
							: undefined)
					}
					id={selectedId}
					filters={filters}
					onClose={() => router.history.back()}
				/>
			)}
			<p {...stylex.props(layoutStyles.availability)}>
				{t("product.availabilityNote")}
			</p>
		</section>
	);
}
const loadingSpin = stylex.keyframes({ to: { transform: "rotate(360deg)" } });
const layoutStyles = stylex.create({
	resultsRegion: { position: "relative" },
	resultsContent: { display: "flex", flexDirection: "column", gap: "32px" },
	loadingOverlay: {
		position: "absolute",
		inset: 0,
		zIndex: 2,
		paddingTop: "24px",
		cursor: "progress",
	},
	loadingScrim: {
		position: "absolute",
		inset: 0,
		backgroundColor: colors.background,
		opacity: 0.85,
	},
	loadingStatus: {
		position: "sticky",
		top: `calc(${metrics.headerHeight} + 80px)`,
		marginInline: "auto",
		width: "fit-content",
		maxWidth: "100%",
		zIndex: 1,
		display: "flex",
		alignItems: "center",
		gap: "10px",
		padding: "12px 16px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		borderRadius: "6px",
		backgroundColor: colors.card,
		color: colors.foreground,
		fontSize: "14px",
		lineHeight: 1.5,
	},
	loadingSpinner: {
		flexShrink: 0,
		animationName: { default: loadingSpin, [conditions.reducedMotion]: "none" },
		animationDuration: "900ms",
		animationTimingFunction: "linear",
		animationIterationCount: "infinite",
	},
	panel: {
		display: "flex",
		flexDirection: "column",
		gap: "32px",
		maxWidth: "1200px",
		width: "100%",
		marginInline: "auto",
	},
	heading: {
		display: "flex",
		alignItems: { default: "end", "@media (max-width: 800px)": "start" },
		justifyContent: "space-between",
		gap: "16px",
		paddingBottom: "8px",
		flexDirection: { default: "row", "@media (max-width: 800px)": "column" },
	},

	heroTitle: {
		fontSize: {
			default: "clamp(30px,3.4vw,46px)",
			[conditions.compactCatalog]: "36px",
		},
		fontWeight: 600,
		lineHeight: 1.18,
		letterSpacing: {
			default: "-.015em",
			":is(:lang(ja), :lang(zh))": "normal",
		},
		textWrap: "balance",
	},
	intro: {
		maxWidth: "34ch",
		fontSize: "16px",
		lineHeight: 1.6,
		color: colors.mutedForeground,
	},
	resultsHeading: {
		display: "flex",
		flexWrap: "wrap",
		justifyContent: "space-between",
		alignItems: "baseline",
		gap: "16px",
		paddingTop: "8px",
	},
	resultsTitle: { fontSize: "20px", fontWeight: 650, letterSpacing: "-.02em" },
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
			default: "repeat(2,minmax(0,1fr))",
			[conditions.compactCatalog]: "minmax(0,1fr)",
			[conditions.tabletGrid]: "repeat(3,minmax(0,1fr))",
		},
		gap: "40px 28px",
	},
	skeleton: {
		overflow: "hidden",
		borderRadius: "8px",
		backgroundColor: colors.card,
		boxShadow: colors.productCardShadow,
	},
	skeletonImage: {
		aspectRatio: { default: "1.15", [conditions.compactCatalog]: "1" },
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
