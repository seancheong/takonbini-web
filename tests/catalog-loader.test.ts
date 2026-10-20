import { QueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { productQueries } from "@/features/products/data/product-queries";
import type { ProductFilters } from "@/features/products/products.contracts";

type Loader = (args: {
	context: { queryClient: QueryClient };
	deps: { search: ProductFilters };
}) => Promise<{ catalogReady?: Promise<void> }>;
type CatalogElement = ReactElement<{
	onApply: (filters: ProductFilters) => Promise<void>;
}>;
const route = vi.hoisted(() => ({
	loader: undefined as Loader | undefined,
	component: undefined as (() => CatalogElement) | undefined,
	navigate: vi.fn(() => Promise.resolve()),
}));
vi.mock("@tanstack/react-router", () => ({
	createFileRoute:
		() => (options: { loader: Loader; component: () => CatalogElement }) => {
			route.loader = options.loader;
			route.component = options.component;
			return {
				...options,
				useSearch: () => ({}),
				useNavigate: () => route.navigate,
				useLoaderData: () => ({ catalogReady: undefined }),
			};
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

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

it.each([true, false])(
	"preserves the first-page promise with SSR=%s",
	async (ssr) => {
		vi.stubEnv("SSR", ssr);
		vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
		vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		let release = () => {};
		let requested = false;
		vi.stubGlobal(
			"fetch",
			() =>
				new Promise<Response>((resolve) => {
					requested = true;
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
			const done = result.then((data) => {
				settled = true;
				return data;
			});
			await vi.waitFor(() => expect(requested).toBe(true));
			expect(settled).toBe(ssr);
			if (ssr) {
				const deferred = await done;
				expect(deferred.catalogReady).toBeInstanceOf(Promise);
				expect(
					client.getQueryData(productQueries.catalog({ limit: 20 }).queryKey),
				).toBeUndefined();
			}
			release();
			const loaded = await done;
			await loaded.catalogReady;
			if (!ssr) expect(loaded.catalogReady).toBeUndefined();
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
	},
);

it("preserves scroll position when the actual catalog filter handler navigates to All stores", async () => {
	if (!route.component) throw new Error("Catalog component was not registered");
	route.navigate.mockClear();
	const element = route.component();
	await element.props.onApply({});
	expect(route.navigate).toHaveBeenCalledWith(
		expect.objectContaining({
			replace: true,
			resetScroll: false,
			search: expect.objectContaining({ stores: undefined }),
		}),
	);
});
