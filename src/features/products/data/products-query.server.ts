import "@tanstack/react-start/server-only";
import { setResponseHeader } from "@tanstack/react-start/server";
import { getProductCatalogSource } from "../products.server";

export async function readProducts(parameters: URLSearchParams) {
	const start = performance.now();
	const result = await getProductCatalogSource().list(parameters);
	setResponseHeader("server-timing", `catalog;dur=${(performance.now() - start).toFixed(1)}`);
	if (!result.ok) throw new Error("Failed to fetch products.");
	return result.value;
}

export async function readProduct(id: string) {
	const result = await getProductCatalogSource().find(id);
	if (!result.ok) throw new Error("Failed to fetch product.");
	return result.value;
}
