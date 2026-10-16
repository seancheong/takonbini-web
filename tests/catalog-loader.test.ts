import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { productQueries } from "@/features/products/data/product-queries";
import type { ProductFilters } from "@/features/products/products.contracts";

type Loader = (args: {
	context: { queryClient: QueryClient };
	deps: { search: ProductFilters };
}) => unknown;
const route = vi.hoisted(() => ({ loader: undefined as Loader | undefined }));
vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: { loader: Loader }) => {
		route.loader = options.loader;
		return options;
	},
}));
vi.mock("@/features/products/products", async () => ({
	CatalogScreen: () => null,
	catalogSearch: (await import("@/features/products/catalog/catalog-search"))
		.catalogSearch,
	productQueries: (await import("@/features/products/data/product-queries"))
		.productQueries,
}));
vi.mock("@/i18n", () => ({ default: { t: (key: string) => key } }));
import "@/routes/index";

afterEach(() => vi.unstubAllGlobals());

it("waits for the first catalog page before completing the route loader's SSR snapshot", async () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	let release = () => {};
	vi.stubGlobal(
		"fetch",
		() =>
			new Promise<Response>((resolve) => {
				release = () => resolve(Response.json({ products: [] }));
			}),
	);
	try {
		if (!route.loader) throw new Error("Catalog loader was not registered");
		const result = route.loader({
			context: { queryClient: client },
			deps: { search: {} },
		});
		expect(result).toBeInstanceOf(Promise);
		let settled = false;
		const done = Promise.resolve(result).then(() => {
			settled = true;
		});
		await Promise.resolve();
		expect(settled).toBe(false);
		release();
		await done;
		expect(
			client.getQueryData(
				productQueries.catalog({ limit: 20, search: undefined }).queryKey,
			),
		).toEqual({
			pages: [{ products: [] }],
			pageParams: [undefined],
		});
	} finally {
		release();
		client.clear();
	}
});
