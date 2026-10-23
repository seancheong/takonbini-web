import {
	parseList,
	parseNumber,
} from "@/features/products/catalog/query-parsers";
import {
	Category,
	REGIONS,
	Store,
} from "@/features/products/model/product-values";
import type { ProductFilters } from "@/features/products/products.contracts";

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

export const defaultProductFilters: ProductFilters = { limit: 20 };

export function normalizeCatalogFilters(
	filters: ProductFilters = {},
): ProductFilters {
	return {
		...defaultProductFilters,
		...filters,
		limit: 20,
		search: filters.search?.trim() || undefined,
	};
}

export function encodeCatalogSearch(filters: ProductFilters): ProductFilters {
	const searchFilters = { ...filters };
	delete searchFilters.limit;
	return {
		...searchFilters,
		search: filters.search?.trim() || undefined,
		stores: filters.stores?.length ? filters.stores : undefined,
		categories: filters.categories?.length ? filters.categories : undefined,
		regions: filters.regions?.length ? filters.regions : undefined,
		includeSoon: filters.includeSoon || undefined,
		minPrice: filters.minPrice !== undefined ? filters.minPrice : undefined,
		maxPrice: filters.maxPrice !== undefined ? filters.maxPrice : undefined,
	};
}

export const catalogSearch = {
	isFiltered: (search: Record<string, unknown>) =>
		Object.values(encodeCatalogSearch(parseCatalogSearch(search))).some(
			(value) => value !== undefined,
		),
	parse: parseCatalogSearch,
	normalize: normalizeCatalogFilters,
	encode: encodeCatalogSearch,
};
