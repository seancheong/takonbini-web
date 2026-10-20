import { afterEach, expect, it, vi } from "vitest";
import {
	getProductById,
	getProducts,
	getProductsPage,
} from "@/features/products/data/products-http-client";

import { catalogProduct } from "@/features/products/testing/catalog-fixtures";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

it("renders a catalog with one upstream request instead of an HTTP request through its own proxy", async () => {
	vi.stubEnv("VERCEL_URL", "web.example.test");
	vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
	vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
	const fetchMock = vi.fn(
		async (input: string, init?: RequestInit): Promise<Response> => {
			if (new URL(input).hostname === "web.example.test") {
				return fetch(
					"https://api.example.test/products?limit=20&status=allWithoutSoon",
					{ headers: { "x-api-key": "test-secret" } },
				);
			}
			expect(init?.headers).toEqual({ "x-api-key": "test-secret" });
			return Response.json({ products: [], nextCursor: "next" });
		},
	);
	vi.stubGlobal("fetch", fetchMock);
	expect(await getProductsPage(undefined, { limit: 20 })).toEqual({
		products: [],
		nextCursor: "next",
	});
	expect(fetchMock).toHaveBeenCalledTimes(1);
	expect(fetchMock.mock.calls[0][0]).toBe(
		"https://api.example.test/products?limit=20&status=allWithoutSoon",
	);
});

it("fails closed when server credentials are missing", async () => {
	vi.stubEnv("PRODUCTS_API_URL", "");
	vi.stubEnv("PRODUCTS_API_KEY", "");
	const fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
	await expect(getProducts()).rejects.toThrow("Failed to fetch products.");
	await expect(getProductById("missing")).rejects.toThrow(
		"Failed to fetch product.",
	);
	expect(fetchMock).not.toHaveBeenCalled();
});

it.each([
	Response.json({ products: [{ id: "invalid" }] }),
	new Response("unavailable", { status: 503 }),
])(
	"rejects an invalid or failed upstream catalog response",
	async (response) => {
		vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
		vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
		await expect(getProducts()).rejects.toThrow("Failed to fetch products.");
	},
);

it("loads a validated detail directly and strips private upstream fields", async () => {
	vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
	vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
	const product = catalogProduct();
	const fetchMock = vi
		.fn()
		.mockResolvedValue(
			Response.json({ ...product, searchKeywords: "private", ttl: 123 }),
		);
	vi.stubGlobal("fetch", fetchMock);
	expect(await getProductById(product.id)).toEqual(product);
	expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
		`https://api.example.test/products/${product.id}`,
		{ headers: { "x-api-key": "test-secret" } },
	);
});
