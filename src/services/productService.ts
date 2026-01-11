import type { Category, PublicProduct, Region, Store } from "@/@types/product";

type ProductsResponse = {
	products: PublicProduct[];
	nextCursor?: string;
};

export const productsQueryKey = ["products"] as const;
export const productsInfiniteQueryKey = ["products", "infinite"] as const;
export const productByIdQueryKey = ["products", "byId"] as const;

export type ProductFilters = {
	search?: string;
	stores?: Store[];
	categories?: Category[];
	regions?: Region[];
	isNew?: boolean;
	minPrice?: number;
	maxPrice?: number;
	limit?: number;
};

export const defaultProductFilters: ProductFilters = {
	limit: 20,
};

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
	getNextPageParam: (lastPage: ProductsResponse) =>
		lastPage.nextCursor ?? undefined,
	staleTime: 1000 * 60 * 30, // 30 minutes
	gcTime: 1000 * 60 * 60, // 1 hour
});

const buildHeaders = () => {
	const headers = new Headers();
	const apiKey = import.meta.env.VITE_PRODUCTS_API_KEY;

	if (import.meta.env.DEV && apiKey) {
		headers.set("x-api-key", apiKey);
	}

	return headers;
};

const getProducts = async () => {
	const response = await fetch(
		`${import.meta.env.VITE_PRODUCTS_API_URL}/products`,
		{ headers: buildHeaders() },
	);

	if (!response.ok) {
		throw new Error("Failed to fetch products.");
	}

	return response.json() as Promise<ProductsResponse>;
};

const getProductById = async (id: string) => {
	const response = await fetch(
		`${import.meta.env.VITE_PRODUCTS_API_URL}/products/${id}`,
		{ headers: buildHeaders() },
	);

	if (!response.ok) {
		throw new Error("Failed to fetch product.");
	}

	return response.json() as Promise<PublicProduct>;
};

const getProductsPage = async (
	cursor: string | undefined,
	filters: ProductFilters,
) => {
	const url = new URL(`${import.meta.env.VITE_PRODUCTS_API_URL}/products`);

	if (cursor) {
		url.searchParams.set("cursor", cursor);
	}

	if (filters.limit) {
		url.searchParams.set("limit", String(filters.limit));
	}

	if (filters.search) {
		url.searchParams.set("search", filters.search);
	}

	if (filters.isNew) {
		url.searchParams.set("isNew", "true");
	}

	if (filters.minPrice !== undefined) {
		url.searchParams.set("minPrice", String(filters.minPrice));
	}

	if (filters.maxPrice !== undefined) {
		url.searchParams.set("maxPrice", String(filters.maxPrice));
	}

	if (filters.stores?.length) {
		url.searchParams.set("stores", filters.stores.join(","));
	}

	if (filters.categories?.length) {
		url.searchParams.set("categories", filters.categories.join(","));
	}

	if (filters.regions?.length) {
		url.searchParams.set("regions", filters.regions.join(","));
	}

	const response = await fetch(url.toString(), {
		headers: buildHeaders(),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch products.");
	}

	return response.json() as Promise<ProductsResponse>;
};
