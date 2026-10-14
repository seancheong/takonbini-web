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
		try {
			response = await fetchProducts(url.toString(), {
				headers: { "x-api-key": configuration.apiKey },
			});
		} catch (error) {
			if (!(error instanceof TypeError)) throw error;
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
		const body = await response.text();
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
		list: (parameters) => read("/products", parameters, catalogPageSchema),
		find: (id, parameters = new URLSearchParams()) =>
			read(`/products/${id}`, parameters, activeCatalogProductSchema),
		async listIndexableIds() {
			const ids: string[] = [];
			let cursor: string | undefined;
			for (let page = 0; page < 50; page += 1) {
				const parameters = new URLSearchParams({ status: "all", limit: "100" });
				if (cursor) parameters.set("cursor", cursor);
				const result = await read(
					"/products",
					parameters,
					catalogIndexPageSchema,
				);
				if (!result.ok) return { ...result, partialIds: ids };
				ids.push(...result.value.products.map((product) => product.id));
				if (!result.value.nextCursor)
					return {
						ok: true,
						value: { ids, complete: true },
						status: 200,
						headers: new Headers(),
					};
				cursor = result.value.nextCursor;
			}
			return {
				ok: true,
				value: { ids, complete: false },
				status: 200,
				headers: new Headers(),
			};
		},
	};
}
