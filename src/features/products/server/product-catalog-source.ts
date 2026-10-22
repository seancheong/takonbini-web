import type { Language } from "@/localization";
import type { ActiveCatalogProduct, CatalogPage } from "../products.contracts";

export type CatalogFailureKind =
	| "not-found"
	| "unavailable"
	| "invalid-upstream-data"
	| "misconfigured";
export type CatalogResult<T> =
	| { ok: true; value: T; status: number; headers: Headers }
	| {
			ok: false;
			kind: CatalogFailureKind;
			status: number;
			headers: Headers;
			body: string;
			origin: "configuration" | "http" | "transport" | "payload";
			partialIds?: string[];
	  };

export interface ProductCatalogSource {
	list(parameters: URLSearchParams): Promise<CatalogResult<CatalogPage>>;
	find(
		id: string,
		parameters?: URLSearchParams,
	): Promise<CatalogResult<ActiveCatalogProduct>>;
	listIndexableProducts(): Promise<
		CatalogResult<{
			products: { id: string; languages: Language[] }[];
			complete: boolean;
		}>
	>;
}
