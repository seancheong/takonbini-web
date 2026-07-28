import { createFileRoute } from "@tanstack/react-router";
import { Category, REGIONS, Store } from "@/@types/product";
import ScrollTopButton from "@/components/ScrollTopButton";
import ProductPanel from "@/features/product/components/ProductPanel";
import CatalogDirectionsPrototype, {
	type CatalogFilterState,
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
	loaded?: number;
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
			loaded: [3, 5].includes(parseNumber(raw.loaded) ?? 0)
				? parseNumber(raw.loaded)
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
		const hasPrototypeFilters =
			search.maxPrice !== undefined ||
			search.stores !== undefined ||
			search.categories !== undefined;
		const prototypeFilters: CatalogFilterState = hasPrototypeFilters
			? {
					stores: (search.stores ?? []).map((store) =>
						store === Store.SEVEN_ELEVEN
							? "7-Eleven"
							: store === Store.FAMILY_MART
								? "FamilyMart"
								: "Lawson",
					),
					categories: search.categories ?? [],
					maxPrice: search.maxPrice ?? 1000,
				}
			: { stores: ["Lawson"], categories: [], maxPrice: 650 };

		return (
			<CatalogDirectionsPrototype
				key={search.variant}
				variant={search.variant}
				initialFilters={prototypeFilters}
				initialSearch={search.search ?? ""}
				initialVisibleProductCount={search.loaded ?? 3}
				onFilterQueryChange={(filters) =>
					navigate({
						search: (previous) => ({
							...previous,
							stores: filters.stores.length
								? filters.stores.map((store) =>
										store === "7-Eleven"
											? Store.SEVEN_ELEVEN
											: store === "FamilyMart"
												? Store.FAMILY_MART
												: Store.LAWSON,
									)
								: undefined,
							categories: filters.categories.length
								? (filters.categories as Category[])
								: undefined,
							maxPrice: filters.maxPrice,
							loaded: 3,
						}),
						replace: true,
						resetScroll: false,
					})
				}
				onSearchQueryChange={(searchQuery) =>
					navigate({
						search: (previous) => ({
							...previous,
							search: searchQuery || undefined,
							loaded: 3,
						}),
						replace: true,
						resetScroll: false,
					})
				}
				onVisibleProductCountChange={(loaded) =>
					navigate({
						search: (previous) => ({ ...previous, loaded }),
						replace: true,
						resetScroll: false,
					})
				}
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
