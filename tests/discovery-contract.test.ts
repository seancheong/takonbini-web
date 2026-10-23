import { expect, it, vi } from "vitest";
import {
	discoveryInput,
	discoveryPageSchema,
} from "@/features/products/discovery";
import { createHttpProductCatalogSource } from "@/features/products/server/takonbini-api-product-catalog.server";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";

const products = Array.from({ length: 20 }, (_, i) =>
	catalogProduct({ id: (i + 1).toString(16).padStart(32, "0") }),
);
it("rejects out-of-order, duplicate, oversized and inconsistent discovery payloads", () => {
	for (const page of [
		{ products: [products[1], products[0]] },
		{ products: [products[0], products[0]] },
		{ products: [...products, products[19]] },
		{ products, nextAfter: products[0].id },
		{ products: products.slice(0, 2), nextAfter: products[1].id },
	])
		expect(discoveryPageSchema.safeParse(page).success).toBe(false);
	expect(
		discoveryPageSchema.parse({ products, nextAfter: products[19].id })
			.products,
	).toHaveLength(20);
});
it("validates immutable boundaries and strips unrelated server-function inputs", () => {
	for (const after of ["", "wrong", "A".repeat(32), [products[0].id]])
		expect(discoveryInput.safeParse({ after }).success).toBe(false);
	expect(
		discoveryInput.parse({
			after: products[0].id,
			limit: 100000,
			search: "tea",
		}),
	).toEqual({ after: products[0].id });
});
it("makes one authenticated bounded discovery read and rejects results before its boundary", async () => {
	const read = vi
		.fn<typeof fetch>()
		.mockResolvedValueOnce(Response.json({ products }));
	const source = createHttpProductCatalogSource({
		baseUrl: "https://api.example.test",
		apiKey: "synthetic",
		fetch: read,
	});
	const result = await source.discovery(products[0].id);
	expect(result).toMatchObject({
		ok: false,
		kind: "invalid-upstream-data",
		origin: "payload",
	});
	expect(read).toHaveBeenCalledTimes(1);
	expect(read).toHaveBeenCalledWith(
		`https://api.example.test/products/discovery?after=${products[0].id}`,
		{ headers: { "x-api-key": "synthetic" }, signal: expect.any(AbortSignal) },
	);
});
it("does not turn upstream failure into a successful empty discovery page", async () => {
	const source = createHttpProductCatalogSource({
		baseUrl: "https://api.example.test",
		apiKey: "synthetic",
		fetch: vi
			.fn()
			.mockResolvedValue(new Response("unavailable", { status: 503 })),
	});
	expect(await source.discovery()).toMatchObject({ ok: false, status: 503 });
});
