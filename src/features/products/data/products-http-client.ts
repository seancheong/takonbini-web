import { createIsomorphicFn } from "@tanstack/react-start";
import { ProductNotFoundError } from "./product-errors";
import type {
	ActiveCatalogProduct,
	CatalogPage,
	ProductFilters,
} from "../products.contracts";

const productStatus = (filters: ProductFilters) =>
	filters.includeSoon ? "all" : "allWithoutSoon";

const getApiBaseUrl = () => window.location.origin;

const getProductsInBrowser = async () => {
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

	return response.json() as Promise<CatalogPage>;
};

const getProductByIdInBrowser = async (id: string) => {
	const response = await fetch(`${getApiBaseUrl()}/api/products/${id}`);
	if (response.status === 404) throw new ProductNotFoundError();

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

	return response.json() as Promise<ActiveCatalogProduct>;
};

const getProductsPageInBrowser = async (
	cursor: string | undefined,
	filters: ProductFilters,
) => {
	const searchParams = productParameters(cursor, filters);
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

	return response.json() as Promise<CatalogPage>;
};

export const getProducts = createIsomorphicFn()
	.server(async () => {
		const { readProducts } = await import("./products-query.server");
		return readProducts(new URLSearchParams({ status: "allWithoutSoon" }));
	})
	.client(getProductsInBrowser);

export const getProductById = createIsomorphicFn()
	.server(async (id: string) => {
		const { readProduct } = await import("./products-query.server");
		return readProduct(id);
	})
	.client(getProductByIdInBrowser);

export const getProductsPage = createIsomorphicFn()
	.server(async (cursor: string | undefined, filters: ProductFilters) => {
		const { readProducts } = await import("./products-query.server");
		return readProducts(productParameters(cursor, filters));
	})
	.client(getProductsPageInBrowser);

function productParameters(
	cursor: string | undefined,
	filters: ProductFilters,
) {
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

	return searchParams;
}
