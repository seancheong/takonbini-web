import { createFileRoute } from "@tanstack/react-router";
import { Category, REGIONS, Store } from "@/@types/product";
import ScrollTopButton from "@/components/ScrollTopButton";
import ProductPanel from "@/features/product/components/ProductPanel";
import CatalogDirectionsPrototype, {
	type CatalogPrototypeVariant,
	catalogPrototypeVariants,
} from "@/features/product/prototype/CatalogDirectionsPrototype";
import i18n from "@/i18n";
import {
	defaultProductFilters,
	type ProductFilters,
	productsInfiniteQueryOptions,
} from "@/services/productService";
import { parseList, parseNumber } from "@/utils/queryParsers";

type CatalogSearch = ProductFilters & {
	variant?: CatalogPrototypeVariant;
};

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
	validateSearch: (search): CatalogSearch => {
		const raw = (search ?? {}) as Record<string, unknown>;

		return {
			variant: catalogPrototypeVariants.includes(
				raw.variant as CatalogPrototypeVariant,
			)
				? (raw.variant as CatalogPrototypeVariant)
				: undefined,
			search: typeof raw.search === "string" ? raw.search : undefined,
			stores: parseList(raw.stores, Object.values(Store)),
			categories: parseList(raw.categories, Object.values(Category)),
			regions: parseList(raw.regions, REGIONS),
			includeSoon:
				raw.includeSoon === true || raw.includeSoon === "true"
					? true
					: undefined,
			minPrice: parseNumber(raw.minPrice),
			maxPrice: parseNumber(raw.maxPrice),
		};
	},
	loaderDeps: ({ search }) => ({
		search,
	}),
	loader: ({ context, deps }) => {
		if (deps.search.variant) return;

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

	if (search.variant) {
		return (
			<CatalogDirectionsPrototype
				key={search.variant}
				variant={search.variant}
			/>
		);
	}

	const appliedFilters = normalizeSearch(search);

	return (
		<div className="min-h-screen bg-background px-4 pb-16 pt-24">
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
