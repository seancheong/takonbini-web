import "@tanstack/react-start/server-only";
import { getProductCatalogSource } from "../products.server";

export async function readProducts(parameters: URLSearchParams) {
	const result = await getProductCatalogSource().list(parameters);
	if (!result.ok) throw new Error("Failed to fetch products.");
	return result.value;
}

export async function readProduct(id: string) {
	const result = await getProductCatalogSource().find(id);
	if (!result.ok) throw new Error("Failed to fetch product.");
	return result.value;
}
