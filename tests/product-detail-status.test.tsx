import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRouteWithContext,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { getSsrStatus } from "@tanstack/react-router/ssr/server";
import { createInstance, type i18n } from "i18next";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";
import { loadProductDetail, Route as ProductRoute } from "@/routes/products.$id";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

it.each<{ upstream: number; expected: number; invalid?: boolean }>([
	{ upstream: 404, expected: 404 },
	{ upstream: 503, expected: 500 },
	{ upstream: 200, expected: 200 },
	{ upstream: 200, expected: 500, invalid: true },
	{ upstream: 0, expected: 500 },
])(
	"maps upstream $upstream to standalone route status $expected",
	async ({ upstream, expected, invalid = false }) => {
		vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
		vi.stubEnv("PRODUCTS_API_KEY", "fixture-key");
		const product = catalogProduct();
		const fetchMock = vi.fn();
		if (upstream === 0) fetchMock.mockRejectedValue(new TypeError("offline"));
		else
			fetchMock.mockResolvedValue(
				Response.json(
					upstream === 200 && !invalid ? product : { error: "unavailable" },
					{ status: upstream },
				),
			);
		vi.stubGlobal("fetch", fetchMock);
		const client = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const root = createRootRouteWithContext<{
			queryClient: QueryClient;
			i18n: i18n;
		}>()();
		const detail = createRoute({
			getParentRoute: () => root,
			path: "/products/$id",
			loader: loadProductDetail,
			errorComponent: ProductRoute.options.errorComponent,
			notFoundComponent: ProductRoute.options.notFoundComponent,
			component: () => null,
		});
		const router = createRouter({
			routeTree: root.addChildren([detail]),
			context: { queryClient: client, i18n: createInstance() },
			history: createMemoryHistory({
				initialEntries: [`/products/${product.id}?stores=Lawson&lang=ja`],
			}),
			isServer: true,
		});
		try {
			await router.load();
			expect(getSsrStatus(router)).toBe(expected);
			expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
				`https://api.example.test/products/${product.id}`,
				{ headers: { "x-api-key": "fixture-key" } },
			);
			if (expected !== 200) {
				const html = renderToString(
					<QueryClientProvider client={client}>
						<RouterProvider router={router} />
					</QueryClientProvider>,
				);
				expect(html).toContain("product.details.notFoundTitle");
				expect(html).toContain("product.retry");
				expect(html).toContain("Lawson");
			}
		} finally {
			client.clear();
		}
	},
);
