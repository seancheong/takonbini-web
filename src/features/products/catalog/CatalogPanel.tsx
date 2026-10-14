import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { productsInfiniteQueryOptions } from "@/features/products/data/product-queries";
import type { ProductFilters } from "@/features/products/products.contracts";
import CatalogControls from "./CatalogControls";
import ProductFilterDrawer from "./CatalogFilters";
import ProductGrid from "./ProductGrid";

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
		select: (state) => state.isLoading,
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
		<section className="catalog-panel mx-auto w-full max-w-6xl">
			<header className="catalog-heading">
				<div>
					<p className="catalog-eyebrow">{t("product.catalogLabel")}</p>
					<h1>{t("product.title")}</h1>
				</div>
				<p className="catalog-intro">{t("product.subtitle")}</p>
			</header>
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
						setDraftFilters({ limit: filters.limit, search: filters.search })
					}
				/>
			</CatalogControls>
			<div className="catalog-results-heading">
				<h2>{t("product.results")}</h2>
				<output aria-live="polite">
					{isLoading
						? t("product.loading")
						: data
							? t("product.loadedCount", { count: products.length })
							: null}
				</output>
			</div>

			{isRefreshing && !isLoading ? (
				<output className="text-sm text-muted-foreground">
					{t("product.loading")}
				</output>
			) : null}

			{isError ? (
				<div
					role="alert"
					className="rounded-xl border border-destructive/30 bg-card p-6"
				>
					<p className="text-sm text-foreground">{t("product.error")}</p>
					<button
						type="button"
						onClick={() => (isFetchNextPageError ? fetchNextPage() : refetch())}
						disabled={isFetching}
						className="mt-4 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
					>
						{t("product.retry")}
					</button>
				</div>
			) : null}

			{isLoading ? (
				<div className="catalog-grid" aria-busy="true">
					{["a", "b", "c", "d", "e", "f", "g", "h"].map((key) => (
						<div key={key} className="catalog-skeleton" aria-hidden="true">
							<div className="catalog-skeleton-image" />
							<div className="catalog-skeleton-copy">
								<span />
								<span />
								<span />
							</div>
						</div>
					))}
				</div>
			) : products.length ? (
				<>
					<ProductGrid products={products} filters={filters} />

					<div className="catalog-pagination">
						{hasNextPage ? (
							<button
								type="button"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
								className="catalog-button"
							>
								{isFetchingNextPage
									? t("product.loadingMore")
									: t("product.loadMore")}
							</button>
						) : (
							<span className="text-sm text-muted-foreground">
								{t("product.end")}
							</span>
						)}
					</div>
				</>
			) : !isError ? (
				<div className="rounded-xl border border-border/60 bg-card p-8 text-center">
					<p className="text-sm text-muted-foreground">
						{t(hasFilters ? "product.noMatches" : "product.empty")}
					</p>
					{hasFilters ? (
						<button
							type="button"
							onClick={() => onApply({ limit: filters.limit })}
							className="mt-4 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
						>
							{t("product.clearFilters")}
						</button>
					) : null}
				</div>
			) : null}
			<p className="catalog-availability">{t("product.availabilityNote")}</p>
		</section>
	);
}
