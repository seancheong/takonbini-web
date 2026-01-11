import type { PublicProduct } from "@/@types/product";

type ProductsResponse = {
	products: PublicProduct[];
	nextCursor?: string;
};

export const productsQueryKey = ["products"] as const;
export const productsInfiniteQueryKey = ["products", "infinite"] as const;

export const productsQueryOptions = () => ({
	queryKey: productsQueryKey,
	queryFn: getProducts,
	staleTime: 1000 * 60 * 30, // 30 minutes
	gcTime: 1000 * 60 * 60, // 1 hour
});

export const productsInfiniteQueryOptions = () => ({
	queryKey: productsInfiniteQueryKey,
	queryFn: ({ pageParam }: { pageParam?: string }) =>
		getProductsPage(pageParam),
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

const getProductsPage = async (cursor?: string) => {
	const url = new URL(`${import.meta.env.VITE_PRODUCTS_API_URL}/products`);

	if (cursor) {
		url.searchParams.set("cursor", cursor);
	}

	const response = await fetch(url.toString(), {
		headers: buildHeaders(),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch products.");
	}

	return response.json() as Promise<ProductsResponse>;
};
