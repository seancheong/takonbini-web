import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProductFilters } from "@/services/productService";
import { productsInfiniteQueryOptions } from "@/services/productService";
import ProductFilterDrawer from "./ProductFilterDrawer";
import ProductGrid from "./ProductGrid";

interface ProductPanelProps {
	filters: ProductFilters;
	onApply: (filters: ProductFilters) => void;
}

const hasActiveFilters = (filters: ProductFilters) =>
	Boolean(
		filters.search ||
			filters.isNew ||
			filters.minPrice !== undefined ||
			filters.maxPrice !== undefined ||
			(filters.stores?.length ?? 0) > 0 ||
			(filters.categories?.length ?? 0) > 0 ||
			(filters.regions?.length ?? 0) > 0,
	);

export default function ProductPanel({ filters, onApply }: ProductPanelProps) {
	const { t } = useTranslation();

	const [draftFilters, setDraftFilters] = useState<ProductFilters>(filters);
	const [isFilterOpen, setIsFilterOpen] = useState(!hasActiveFilters(filters));
	const [isFilterManual, setIsFilterManual] = useState(false);
	const hasAutoClosed = useRef(false);

	useEffect(() => {
		setDraftFilters(filters);

		if (hasActiveFilters(filters)) {
			setIsFilterOpen(false);
			hasAutoClosed.current = true;
		}
	}, [filters]);

	useEffect(() => {
		const handleScroll = () => {
			if (isFilterManual || hasAutoClosed.current) return;

			const maxScroll =
				document.documentElement.scrollHeight - window.innerHeight;

			if (maxScroll <= 32 || window.scrollY <= 4) {
				setIsFilterOpen(true);
				return;
			}

			setIsFilterOpen(false);
			hasAutoClosed.current = true;
		};

		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [isFilterManual]);

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
				setIsFilterOpen={(open) => {
					setIsFilterOpen(open);
					if (!open) {
						hasAutoClosed.current = true;
					}
				}}
				setIsFilterManual={(manual) => {
					setIsFilterManual(manual);
					if (manual && isFilterOpen === false) {
						hasAutoClosed.current = true;
					}
				}}
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
								className="rounded-full border border-border/60 px-5 py-2 text-sm font-semibold text-foreground transition hover:border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
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
