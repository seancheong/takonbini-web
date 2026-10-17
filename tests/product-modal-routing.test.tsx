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
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import CatalogScreen from "@/features/products/catalog/CatalogScreen";
import { catalogSearch } from "@/features/products/catalog/catalog-search";
import ProductDetailScreen from "@/features/products/detail/ProductDetailScreen";
import { productQueries } from "@/features/products/products";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
afterEach(async () => {
	cleanup();
	await new Promise(requestAnimationFrame);
	vi.unstubAllGlobals();
});
it("opens a masked product URL, closes through history, reopens with Forward, and loads a page after reload", async () => {
	Object.defineProperties(HTMLDialogElement.prototype, {
		showModal: {
			configurable: true,
			value: function (this: HTMLDialogElement) {
				this.setAttribute("open", "");
			},
		},
		close: {
			configurable: true,
			value: function (this: HTMLDialogElement) {
				this.removeAttribute("open");
				this.dispatchEvent(new Event("close"));
			},
		},
	});
	vi.stubGlobal("scrollTo", vi.fn());
	const product = catalogProduct({ images: [] });
	const filters = { limit: 20 };
	const client = new QueryClient();
	client.setQueryData(productQueries.catalog(filters).queryKey, {
		pages: [{ products: [product] }],
		pageParams: [undefined],
	});
	client.setQueryData(productQueries.detail(product.id).queryKey, product);
	const root = createRootRoute({ component: Outlet });
	const catalog = createRoute({
		getParentRoute: () => root,
		path: "/",
		validateSearch: catalogSearch.parse,
		component: () => <CatalogScreen filters={filters} onApply={() => {}} />,
	});
	const detail = createRoute({
		getParentRoute: () => root,
		path: "/products/$id",
		component: () => <ProductDetailScreen id={product.id} filters={{}} />,
	});
	const routeTree = root.addChildren([catalog, detail]);
	const history = createMemoryHistory({ initialEntries: ["/"] });
	const router = createRouter({ routeTree, history });
	await router.load();
	const view = render(
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
	fireEvent.click(await screen.findByRole("link", { name: "Matcha" }));
	await screen.findByRole("dialog", { name: "Matcha" });
	expect(history.location.pathname).toBe(`/products/${product.id}`);
	expect(router.state.location.pathname).toBe("/");
	expect(screen.getByText("Tea dessert")).toBeTruthy();
	fireEvent.click(
		screen.getByRole("button", { name: "product.details.close" }),
	);
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(history.location.pathname).toBe("/");
	await act(async () => router.history.forward());
	await screen.findByRole("dialog");
	view.unmount();
	const refreshed = createRouter({ routeTree, history });
	await refreshed.load();
	render(
		<QueryClientProvider client={client}>
			<RouterProvider router={refreshed} />
		</QueryClientProvider>,
	);
	await screen.findByRole("link", { name: "product.details.back" });
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(screen.getByText("Tea dessert")).toBeTruthy();
	client.clear();
});
