import { describe, expect, it, vi } from "vitest";
import {
	activeCatalogProductSchema,
	Store,
} from "@/features/products/products.contracts";
import { createHttpProductCatalogSource } from "@/features/products/server/takonbini-api-product-catalog.server";
import {
	catalogFixtures,
	catalogProduct,
} from "@/features/products/testing/catalog-fixtures";
import { createInMemoryProductCatalogSource } from "@/features/products/testing/in-memory-product-catalog-source";

const configuration = {
	baseUrl: "https://api.example.test",
	apiKey: "test-secret",
};

for (const adapter of ["http", "in-memory"] as const)
	describe(`${adapter} catalog source`, () => {
		function source() {
			if (adapter === "in-memory")
				return createInMemoryProductCatalogSource(
					catalogFixtures,
					new Date("2026-01-01"),
				);
			return createHttpProductCatalogSource({
				...configuration,
				fetch: vi.fn().mockImplementation(async (url: string) => {
					const request = new URL(url);
					if (request.pathname === "/products")
						return Response.json({
							products: catalogFixtures.filter(
								(product) => product.store === Store.LAWSON,
							),
						});
					if (request.pathname.endsWith("/lawson"))
						return Response.json(catalogFixtures[1]);
					return new Response("Product not found", { status: 404 });
				}),
			});
		}
		it("lists supported products using the shared contract", async () => {
			const result = await source().list(
				new URLSearchParams({ stores: Store.LAWSON }),
			);
			expect(result.ok).toBe(true);
			if (!result.ok) throw new Error("Expected successful catalog page");
			expect(result.value.products).toEqual([catalogFixtures[1]]);
		});
		it("finds a known product and represents an absent one explicitly", async () => {
			const catalog = source();
			const found = await catalog.find("lawson");
			expect(found.ok && found.value).toEqual(catalogFixtures[1]);
			expect(await catalog.find("absent")).toMatchObject({
				ok: false,
				kind: "not-found",
				status: 404,
			});
		});
	});

describe("remote product validation", () => {
	it("excludes API-internal fields while allowing missing translations and zero prices", () => {
		const product = catalogProduct({ title: { ja: "商品" }, price: 0 });
		expect(
			activeCatalogProductSchema.parse({
				...product,
				searchKeywords: "private",
				ttl: 1,
				isTranslated: true,
			}),
		).toEqual(product);
	});
	it.each([
		{ products: [{ id: "partial" }] },
		{ products: [catalogProduct({ price: Number.NaN })] },
		{ products: [], nextCursor: 12 },
	])("rejects malformed successful responses", async (payload) => {
		const source = createHttpProductCatalogSource({
			...configuration,
			fetch: vi.fn().mockResolvedValue(Response.json(payload)),
		});
		expect(await source.list(new URLSearchParams())).toMatchObject({
			ok: false,
			kind: "invalid-upstream-data",
			status: 502,
		});
	});
	it("fails closed for missing configuration without making a request", async () => {
		const fetchMock = vi.fn();
		const result = await createHttpProductCatalogSource({
			fetch: fetchMock,
		}).list(new URLSearchParams());
		expect(result).toMatchObject({
			ok: false,
			kind: "misconfigured",
			status: 500,
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it("returns transport failures explicitly and lets unexpected programming errors throw", async () => {
		const transport = createHttpProductCatalogSource({
			...configuration,
			fetch: vi.fn().mockRejectedValue(new TypeError("fetch failed")),
		});
		expect(await transport.find("id")).toMatchObject({
			ok: false,
			kind: "unavailable",
			origin: "transport",
			status: 500,
		});
		const broken = createHttpProductCatalogSource({
			...configuration,
			fetch: vi.fn().mockRejectedValue(new Error("programming fault")),
		});
		await expect(broken.find("id")).rejects.toThrow("programming fault");
	});
	it("strips internal fields and obsolete body headers from validated products", async () => {
		const product = catalogProduct();
		const source = createHttpProductCatalogSource({
			...configuration,
			fetch: vi
				.fn()
				.mockResolvedValue(
					new Response(JSON.stringify({ ...product, ttl: 1 }), {
						headers: {
							"x-upstream": "kept",
							"content-length": "999",
							"content-encoding": "gzip",
						},
					}),
				),
		});
		const result = await source.find(product.id);
		expect(result.ok && result.value).toEqual(product);
		expect(result.headers.get("x-upstream")).toBe("kept");
		expect(result.headers.has("content-length")).toBe(false);
		expect(result.headers.has("content-encoding")).toBe(false);
	});
	it("returns an incomplete index explicitly after a later HTTP failure", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				Response.json({ products: [{ id: "first" }], nextCursor: "next" }),
			)
			.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
		const result = await createHttpProductCatalogSource({
			...configuration,
			fetch: fetchMock,
		}).listIndexableIds();
		expect(result).toMatchObject({
			ok: false,
			origin: "http",
			partialIds: ["first"],
		});
	});
	it("keeps in-memory pagination, upcoming products and localized search deterministic", async () => {
		const source = createInMemoryProductCatalogSource(
			catalogFixtures,
			new Date("2026-01-01"),
		);
		const first = await source.list(
			new URLSearchParams({ status: "all", limit: "1" }),
		);
		expect(first.ok && first.value.nextCursor).toBe("1");
		const next = await source.list(
			new URLSearchParams({ status: "all", limit: "1", cursor: "1" }),
		);
		expect(next.ok && next.value.products[0].id).toBe("lawson");
		const upcoming = await source.list(
			new URLSearchParams({ status: "soon", search: "パン" }),
		);
		expect(
			upcoming.ok && upcoming.value.products.map((product) => product.id),
		).toEqual(["family"]);
	});
});
