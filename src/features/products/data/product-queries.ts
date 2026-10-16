import type { CatalogPage, ProductFilters } from "../products.contracts";
import {
	getProductById,
	getProducts,
	getProductsPage,
} from "./products-http-client";
export const productsQueryKey = ["products"] as const;
export const productsInfiniteQueryKey = ["products", "infinite"] as const;
export const productByIdQueryKey = ["products", "byId"] as const;

const normalizeFilters = (filters: ProductFilters) => ({
	...filters,
	search: filters.search?.trim() || undefined,
	stores: filters.stores?.slice().sort(),
	categories: filters.categories?.slice().sort(),
	regions: filters.regions?.slice().sort(),
});

export const productsQueryOptions = () => ({
	queryKey: productsQueryKey,
	queryFn: getProducts,
	staleTime: 1000 * 60 * 30, // 30 minutes
	gcTime: 1000 * 60 * 60, // 1 hour
});

export const productByIdQueryOptions = (id: string) => ({
	queryKey: [...productByIdQueryKey, id] as const,
	queryFn: () => getProductById(id),
	staleTime: 1000 * 60 * 30, // 30 minutes
	gcTime: 1000 * 60 * 60, // 1 hour
});

export const productsInfiniteQueryOptions = (filters: ProductFilters) => ({
	queryKey: [...productsInfiniteQueryKey, normalizeFilters(filters)] as const,
	queryFn: ({ pageParam }: { pageParam?: string }) =>
		getProductsPage(pageParam, filters),
	initialPageParam: undefined as string | undefined,
	getNextPageParam: (lastPage: CatalogPage) => lastPage.nextCursor ?? undefined,
	staleTime: 1000 * 60 * 30, // 30 minutes
	gcTime: 1000 * 60 * 60, // 1 hour
});

export const productQueries = {
	catalog: productsInfiniteQueryOptions,
	detail: productByIdQueryOptions,
	all: productsQueryOptions,
};
