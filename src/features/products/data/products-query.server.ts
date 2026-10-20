import "@tanstack/react-start/server-only";
import { catalogTiming } from "@/server/catalog-timing.server";
import { getProductCatalogSource } from "../products.server";

export async function readProducts(parameters: URLSearchParams) {
	const started = performance.now();
	const result = await getProductCatalogSource().list(parameters);
	const timing = catalogTiming.getStore();
	if (timing) timing.sourceMs += performance.now() - started;
	if (!result.ok) throw new Error("Failed to fetch products.");
	return result.value;
}

export async function readProduct(id: string) {
	const result = await getProductCatalogSource().find(id);
	if (!result.ok) throw new Error("Failed to fetch product.");
	return result.value;
}
