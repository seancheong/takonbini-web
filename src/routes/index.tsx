import { createFileRoute } from "@tanstack/react-router";
import ScrollTopButton from "@/components/ScrollTopButton";
import ProductPanel from "@/features/products/catalog/CatalogPanel";
import { parseCatalogSearch } from "@/features/products/catalog/catalog-search";
import {
	defaultProductFilters,
	productsInfiniteQueryOptions,
} from "@/features/products/data/product-queries";
import type { ProductFilters } from "@/features/products/products.contracts";
import i18n from "@/i18n";

const normalizeSearch = (filters?: ProductFilters) => {
	const safeFilters = filters ?? {};
	return {
		...defaultProductFilters,
		...safeFilters,
		search: safeFilters.search?.trim() || undefined,
	};
};

export const Route = createFileRoute("/")({
	component: App,
	validateSearch: parseCatalogSearch,
	loaderDeps: ({ search }) => ({
		search,
	}),
	loader: ({ context, deps }) => {
		const filters = normalizeSearch(deps.search);
		context.queryClient.prefetchInfiniteQuery(
			productsInfiniteQueryOptions(filters),
		);
	},
	head: () => ({
		meta: [{ title: i18n.t("appName") }],
	}),
});

function App() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const appliedFilters = normalizeSearch(search);

	return (
		<div className="min-h-screen bg-background px-4 pb-16 pt-28">
			<ProductPanel
				filters={appliedFilters}
				onApply={(nextFilters) => {
					// biome-ignore lint/correctness/noUnusedVariables: Ignore limit for other searchFilters extraction
					const { limit, ...searchFilters } = nextFilters;

					navigate({
						search: {
							...searchFilters,
							search: nextFilters.search?.trim() || undefined,
							stores: nextFilters.stores?.length
								? nextFilters.stores
								: undefined,
							categories: nextFilters.categories?.length
								? nextFilters.categories
								: undefined,
							regions: nextFilters.regions?.length
								? nextFilters.regions
								: undefined,
							includeSoon: nextFilters.includeSoon || undefined,
							minPrice:
								nextFilters.minPrice !== undefined
									? nextFilters.minPrice
									: undefined,
							maxPrice:
								nextFilters.maxPrice !== undefined
									? nextFilters.maxPrice
									: undefined,
						},
						replace: true,
					});
				}}
			/>
			<ScrollTopButton />
		</div>
	);
}
