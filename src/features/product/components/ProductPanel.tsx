import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProductFilters } from "@/services/productService";
import { productsInfiniteQueryOptions } from "@/services/productService";
import ProductFilterDrawer from "./ProductFilterDrawer";
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
		isError,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		isFetching,
	} = useInfiniteQuery(productsInfiniteQueryOptions(filters));
	const products = data?.pages.flatMap((page) => page.products) ?? [];
	const routerIsLoading = useRouterState({
		select: (state) => state.isLoading,
	});
	const showOverlay = routerIsLoading || (isFetching && !isFetchingNextPage);

	return (
		<section className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
			{showOverlay ? (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
					aria-live="polite"
				>
					<div className="flex items-center gap-3 rounded-full border border-border/60 bg-background px-5 py-3 text-sm font-semibold text-foreground shadow-lg">
						<span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />

						{t("product.loading")}
					</div>
				</div>
			) : null}

			<ProductFilterDrawer
				filters={draftFilters}
				setFilters={setDraftFilters}
				isFilterOpen={isFilterOpen}
				setIsFilterOpen={setIsFilterOpen}
				onApply={onApply}
				onReset={() => {
					const resetFilters: ProductFilters = {
						limit: filters.limit,
					};
					setDraftFilters(resetFilters);
				}}
			/>

			<div>
				<h1 className="text-4xl font-bold text-foreground">
					{t("product.title")}
				</h1>

				<p className="mt-3 text-base text-muted-foreground">
					{t("product.subtitle")}
				</p>
			</div>

			{isError ? (
				<div className="rounded-2xl border border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground">
					{t("product.error")}
				</div>
			) : null}

			{isLoading ? (
				<div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<div
							key={`product-skeleton-${
								// biome-ignore lint/suspicious/noArrayIndexKey: ignore for skeleton keys
								index
							}`}
							className="h-90 animate-pulse rounded-2xl border border-border/50 bg-muted/40"
						/>
					))}
				</div>
			) : products.length ? (
				<>
					<ProductGrid products={products} />

					<div className="flex justify-center">
						{hasNextPage ? (
							<button
								type="button"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
								className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary/60 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/30"
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
			) : (
				<div className="rounded-2xl border border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground">
					{t("product.empty")}
				</div>
			)}
		</section>
	);
}
