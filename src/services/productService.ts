import type { PublicProduct } from "@/@types/product";

type ProductsResponse = {
	products: PublicProduct[];
	nextCursor?: string;
};

export const productsQueryKey = ["products"] as const;

export const productsQueryOptions = () => ({
	queryKey: productsQueryKey,
	queryFn: getProducts,
	staleTime: 1000 * 60 * 30, // 30 minutes
	gcTime: 1000 * 60 * 60, // 1 hour
});

const getProducts = async () => {
	const headers = new Headers();
	const apiKey = import.meta.env.VITE_PRODUCTS_API_KEY;

	if (import.meta.env.DEV && apiKey) {
		headers.set("x-api-key", apiKey);
	}

	const response = await fetch(
		`${import.meta.env.VITE_PRODUCTS_API_URL}/products`,
		{ headers },
	);

	if (!response.ok) {
		throw new Error("Failed to fetch products.");
	}

	return response.json() as Promise<ProductsResponse>;
};
