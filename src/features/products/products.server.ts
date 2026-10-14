import "@tanstack/react-start/server-only";
import { createHttpProductCatalogSource } from "./server/takonbini-api-product-catalog.server";

export type {
	CatalogResult,
	ProductCatalogSource,
} from "./server/product-catalog-source";

export function getProductCatalogSource() {
	return createHttpProductCatalogSource({
		baseUrl: process.env.PRODUCTS_API_URL,
		apiKey: process.env.PRODUCTS_API_KEY,
	});
}
