import {
	parseList,
	parseNumber,
} from "@/features/products/catalog/query-parsers";
import type { ProductFilters } from "@/features/products/data/product-queries";
import {
	Category,
	REGIONS,
	Store,
} from "@/features/products/products.contracts";

export function parseCatalogSearch(
	search: Record<string, unknown>,
): ProductFilters {
	return {
		search: typeof search.search === "string" ? search.search : undefined,
		stores: parseList(search.stores, Object.values(Store)),
		categories: parseList(search.categories, Object.values(Category)),
		regions: parseList(search.regions, REGIONS),
		includeSoon:
			search.includeSoon === true || search.includeSoon === "true"
				? true
				: undefined,
		minPrice: parseNumber(search.minPrice),
		maxPrice: parseNumber(search.maxPrice),
	};
}
