// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { catalogSearch } from "@/features/products/catalog/catalog-search";
import ProductDetailError from "@/features/products/detail/ProductDetailError";
import ProductDetailScreen from "@/features/products/detail/ProductDetailScreen";
import { productQueries } from "@/features/products/products";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";
import { Route as ProductRoute } from "@/routes/products.$id";

const readProduct = vi.hoisted(() => vi.fn());
vi.mock("@/features/products/data/products-http-client", () => ({
	getProductById: readProduct,
	getProducts: vi.fn(),
	getProductsPage: vi.fn(),
}));
vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("recovers the standalone error route after repeated failures and focuses the loaded title", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.stubGlobal("scrollTo", vi.fn());
	const product = catalogProduct({ images: [] });
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const unrelated = { preserved: true };
	client.setQueryData(["unrelated"], unrelated);
	readProduct.mockReset().mockRejectedValue(new Error("offline"));
	const root = createRootRoute({
		component: () => (
			<main>
				<Outlet />
			</main>
		),
	});
	const detail = createRoute({
		getParentRoute: () => root,
		path: "/products/$id",
		validateSearch: catalogSearch.parse,
		loader: () => client.ensureQueryData(productQueries.detail(product.id)),
		errorComponent: ProductRoute.options.errorComponent,
		pendingComponent: ProductRoute.options.pendingComponent,
		component: () => <ProductDetailScreen id={product.id} filters={{}} />,
	});
	const router = createRouter({
		defaultPendingMinMs: 0,
		defaultPendingMs: 0,
		routeTree: root.addChildren([detail]),
		history: createMemoryHistory({
			initialEntries: [`/products/${product.id}?stores=Lawson&lang=ja`],
		}),
	});
	await router.load();
	render(
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
	try {
		await screen.findByRole(
			"button",
			{ name: "product.retry" },
			{ timeout: 3000 },
		);
		await waitFor(() => expect(router.state.status).toBe("idle"));
		const initialReads = readProduct.mock.calls.length;
		expect(
			screen
				.getByRole("link", { name: "product.details.back" })
				.getAttribute("href"),
		).toContain("Lawson");
		fireEvent.click(screen.getByRole("button", { name: "product.retry" }));
		await waitFor(() =>
			expect(readProduct).toHaveBeenCalledTimes(initialReads + 1),
		);
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "product.retry" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
		readProduct.mockResolvedValueOnce(product);
		fireEvent.click(screen.getByRole("button", { name: "product.retry" }));
		const title = await screen.findByRole("heading", { name: "Matcha" });
		await waitFor(() => expect(document.activeElement).toBe(title));
		expect(router.state.location.pathname).toBe(`/products/${product.id}`);
		expect(readProduct).toHaveBeenCalledTimes(initialReads + 2);
		expect(client.getQueryData(["unrelated"])).toBe(unrelated);
	} finally {
		client.clear();
	}
});

it("does not recover or move focus after leaving a pending retry", async () => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const product = catalogProduct();
	let finish: (value: typeof product) => void = () => {};
	readProduct.mockReset().mockImplementation(
		() =>
			new Promise<typeof product>((resolve) => {
				finish = resolve;
			}),
	);
	const recovered = vi.fn();
	const root = createRootRoute({
		component: () => (
			<ProductDetailError
				id={product.id}
				filters={{}}
				onRecovered={recovered}
			/>
		),
	});
	const router = createRouter({
		routeTree: root,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	await router.load();
	const view = render(
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
	fireEvent.click(await screen.findByRole("button", { name: "product.retry" }));
	await waitFor(() => expect(readProduct).toHaveBeenCalledOnce());
	view.unmount();
	finish(product);
	await waitFor(() =>
		expect(
			client.getQueryData(productQueries.detail(product.id).queryKey),
		).toEqual(product),
	);
	expect(recovered).not.toHaveBeenCalled();
	client.clear();
});
