import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { productQueries } from "@/features/products/data/product-queries";

vi.mock("@/features/products/data/products-http-client", () => ({
	getProductsPage: async () => ({ products: [{ id: "ssr-seed" }] }),
	getProductById: vi.fn(),
	getProducts: vi.fn(),
}));
afterEach(() => vi.unstubAllGlobals());
const nextTurn = () => new Promise((resolve) => setTimeout(resolve, 10));

it("retains a prefetched catalog until its request-scoped lazy SSR route renders", async () => {
	const client = new QueryClient();
	const options = productQueries.catalog({ limit: 20 });
	try {
		await client.prefetchInfiniteQuery(options);
		await nextTurn();
		expect(client.getQueryData(options.queryKey)).toMatchObject({
			pages: [{ products: [{ id: "ssr-seed" }] }],
		});
	} finally {
		client.clear();
	}
});

it("still collects an inactive browser catalog instead of retaining old filter payloads", async () => {
	vi.stubGlobal("window", {});
	const client = new QueryClient();
	const options = productQueries.catalog({ limit: 20 });
	try {
		await client.prefetchInfiniteQuery(options);
		await nextTurn();
		expect(client.getQueryData(options.queryKey)).toBeUndefined();
	} finally {
		client.clear();
	}
});
