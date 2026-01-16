import type { Category, PublicProduct, Region, Store } from "@/@types/product";

type ProductsResponse = {
	products: PublicProduct[];
	nextCursor?: string;
};

export const productsQueryKey = ["products"] as const;
export const productsInfiniteQueryKey = ["products", "infinite"] as const;
export const productByIdQueryKey = ["products", "byId"] as const;

export const productStatuses = [
	"allWithoutSoon",
	"new",
	"soon",
	"all",
] as const;
export type ProductStatus = (typeof productStatuses)[number];

export type ProductFilters = {
	search?: string;
	stores?: Store[];
	categories?: Category[];
	regions?: Region[];
	minPrice?: number;
	maxPrice?: number;
	limit?: number;
	includeSoon?: boolean;
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

const productStatus = (filters: ProductFilters): ProductStatus =>
	filters.includeSoon ? "all" : "allWithoutSoon";

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

const getApiBaseUrl = () => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}

	const vercelUrl = process.env.VERCEL_URL;
	if (vercelUrl) {
		return `https://${vercelUrl}`;
	}

	const host = process.env.HOST ?? "localhost:3000";
	const protocol = process.env.PROTOCOL ?? "http";
	return `${protocol}://${host}`;
};

const getProducts = async () => {
	const url = new URL(`${getApiBaseUrl()}/api/products`);
	url.searchParams.set("status", "allWithoutSoon");
	const response = await fetch(url.toString());

	if (!response.ok) {
		let body = "";
		try {
			body = await response.text();
		} catch (error) {
			console.error("Failed reading products response body", { error });
		}

		console.error("Products request failed", {
			status: response.status,
			body: body.slice(0, 2000),
		});

		throw new Error("Failed to fetch products.");
	}

	return response.json() as Promise<ProductsResponse>;
};

const getProductById = async (id: string) => {
	const response = await fetch(`${getApiBaseUrl()}/api/products/${id}`);

	if (!response.ok) {
		let body = "";
		try {
			body = await response.text();
		} catch (error) {
			console.error("Failed reading product response body", { error });
		}

		console.error("Product request failed", {
			status: response.status,
			body: body.slice(0, 2000),
		});

		throw new Error("Failed to fetch product.");
	}

	return response.json() as Promise<PublicProduct>;
};

const getProductsPage = async (
	cursor: string | undefined,
	filters: ProductFilters,
) => {
	const searchParams = new URLSearchParams();

	if (cursor) {
		searchParams.set("cursor", cursor);
	}

	if (filters.limit) {
		searchParams.set("limit", String(filters.limit));
	}

	if (filters.search) {
		searchParams.set("search", filters.search);
	}

	searchParams.set("status", productStatus(filters));

	if (filters.minPrice !== undefined) {
		searchParams.set("minPrice", String(filters.minPrice));
	}

	if (filters.maxPrice !== undefined) {
		searchParams.set("maxPrice", String(filters.maxPrice));
	}

	if (filters.stores?.length) {
		searchParams.set("stores", filters.stores.join(","));
	}

	if (filters.categories?.length) {
		searchParams.set("categories", filters.categories.join(","));
	}

	if (filters.regions?.length) {
		searchParams.set("regions", filters.regions.join(","));
	}

	const query = searchParams.toString();
	const baseUrl = `${getApiBaseUrl()}/api/products`;
	const response = await fetch(query ? `${baseUrl}?${query}` : baseUrl);

	if (!response.ok) {
		let body = "";
		try {
			body = await response.text();
		} catch (error) {
			console.error("Failed reading products page response body", { error });
		}
		console.error("Products page request failed", {
			status: response.status,
			body: body.slice(0, 2000),
		});
		throw new Error("Failed to fetch products.");
	}

	return response.json() as Promise<ProductsResponse>;
};
