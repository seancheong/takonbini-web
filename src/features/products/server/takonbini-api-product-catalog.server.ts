import { discoveryPageSchema } from "../discovery";
import { productIndexing } from "../model/product-indexing";
import type { Language } from "@/localization";
import type { z } from "zod";
import {
	activeCatalogProductSchema,
	catalogIndexPageSchema,
	catalogPageSchema,
} from "../products.contracts";
import type {
	CatalogResult,
	ProductCatalogSource,
} from "./product-catalog-source";

interface CatalogHttpConfiguration {
	baseUrl?: string;
	apiKey?: string;
	fetch?: typeof fetch;
}

export function createHttpProductCatalogSource(
	configuration: CatalogHttpConfiguration,
): ProductCatalogSource {
	const fetchProducts = configuration.fetch ?? fetch;
	async function read<T>(
		path: string,
		parameters: URLSearchParams,
		schema: z.ZodType<T>,
		signal?: AbortSignal,
	): Promise<CatalogResult<T>> {
		if (!configuration.baseUrl || !configuration.apiKey)
			return {
				ok: false,
				kind: "misconfigured",
				origin: "configuration",
				status: 500,
				headers: new Headers(),
				body: "Unknown Error",
			};
		const url = new URL(`${configuration.baseUrl}${path}`);
		url.search = parameters.toString();
		let response: Response;
		let body: string;
		try {
			response = await fetchProducts(url.toString(), {
				headers: { "x-api-key": configuration.apiKey },
				...(signal ? { signal } : {}),
			});
			body = await response.text();
		} catch (error) {
			if (!(error instanceof TypeError) && !signal?.aborted) throw error;
			return {
				ok: false,
				kind: "unavailable",
				origin: "transport",
				status: 500,
				headers: new Headers(),
				body: "Unknown Error",
			};
		}
		const headers = new Headers(response.headers);
		if (!response.ok)
			return {
				ok: false,
				kind: response.status === 404 ? "not-found" : "unavailable",
				origin: "http",
				status: response.status,
				headers,
				body,
			};
		let payload: unknown;
		try {
			payload = JSON.parse(body);
		} catch (error) {
			if (!(error instanceof SyntaxError)) throw error;
			return {
				ok: false,
				kind: "invalid-upstream-data",
				origin: "payload",
				status: 502,
				headers: new Headers(),
				body: "Invalid product response",
			};
		}
		const parsed = schema.safeParse(payload);
		if (!parsed.success)
			return {
				ok: false,
				kind: "invalid-upstream-data",
				origin: "payload",
				status: 502,
				headers: new Headers(),
				body: "Invalid product response",
			};
		// Fetch decodes the upstream body and validation may strip internal fields.
		headers.delete("content-length");
		headers.delete("content-encoding");
		return { ok: true, value: parsed.data, status: response.status, headers };
	}
	return {
		async discovery(after) {
			const result = await read(
				"/products/discovery",
				new URLSearchParams(after ? { after } : {}),
				discoveryPageSchema,
				AbortSignal.timeout(10_000),
			);
			if (
				result.ok &&
				after &&
				result.value.products.some((product) => product.id <= after)
			) {
				return {
					ok: false,
					kind: "invalid-upstream-data",
					origin: "payload",
					status: 502,
					headers: new Headers(),
					body: "Invalid discovery boundary",
				};
			}
			return result;
		},
		list: (parameters) => read("/products", parameters, catalogPageSchema),
		find: (id, parameters = new URLSearchParams()) =>
			read(`/products/${id}`, parameters, activeCatalogProductSchema),
		async listIndexableProducts() {
			const products = new Map<string, { id: string; languages: Language[] }>();
			const cursors = new Set<string>();
			const signal = AbortSignal.timeout(45_000);
			let cursor: string | undefined;
			for (let page = 0; page < 500; page += 1) {
				const parameters = new URLSearchParams({ status: "all", limit: "100" });
				if (cursor) parameters.set("cursor", cursor);
				const result = await read(
					"/products",
					parameters,
					catalogIndexPageSchema,
					signal,
				);
				if (!result.ok) return { ...result, partialIds: [...products.keys()] };
				for (const product of result.value.products) {
					products.set(product.id, {
						id: product.id,
						languages: productIndexing(product, "ja").sitemapLanguages,
					});
				}
				// The sitemap applies its URL budget after expanding locale variants.
				if (products.size > 49_999) break;
				if (!result.value.nextCursor)
					return {
						ok: true,
						value: { products: [...products.values()], complete: true },
						status: 200,
						headers: new Headers(),
					};
				cursor = result.value.nextCursor;
				if (cursors.has(cursor)) break;
				cursors.add(cursor);
			}
			return {
				ok: true,
				value: { products: [...products.values()], complete: false },
				status: 200,
				headers: new Headers(),
			};
		},
	};
}
