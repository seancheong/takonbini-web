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
import { catalogSearch } from "@/features/products/catalog/catalog-search";
import ProductCard from "@/features/products/catalog/ProductCard";
import ProductDetailScreen from "@/features/products/detail/ProductDetailScreen";
import { productQueries } from "@/features/products/products";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";
import { getScrollRestorationKey } from "@/scroll-restoration";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

it("restores the catalog position through the detail return link, including the normalized page limit", async () => {
	let scrollY = 0;
	vi.stubGlobal("scrollY", 0);
	vi.stubGlobal("scrollX", 0);
	vi.stubGlobal(
		"scrollTo",
		vi.fn((options: ScrollToOptions) => {
			scrollY = options.top ?? 0;
			vi.stubGlobal("scrollY", scrollY);
		}),
	);
	const product = catalogProduct({ images: [] });
	const client = new QueryClient();
	client.setQueryData(productQueries.detail(product.id).queryKey, product);
	const root = createRootRoute({ component: Outlet });
	const catalog = createRoute({
		getParentRoute: () => root,
		path: "/",
		validateSearch: catalogSearch.parse,
		component: () => (
			<ProductCard
				product={product}
				filters={catalogSearch.normalize(catalog.useSearch())}
			/>
		),
	});
	const detail = createRoute({
		getParentRoute: () => root,
		path: "/products/$id",
		validateSearch: catalogSearch.parse,
		component: () => (
			<ProductDetailScreen id={product.id} filters={detail.useSearch()} />
		),
	});
	const router = createRouter({
		routeTree: root.addChildren([catalog, detail]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
		scrollRestoration: true,
		getScrollRestorationKey,
	});
	await router.load();
	render(
		<QueryClientProvider client={client}>
			<RouterProvider router={router} />
		</QueryClientProvider>,
	);
	await screen.findByRole("link", { name: "Matcha" });
	await act(async () => {
		vi.stubGlobal("scrollY", 720);
		scrollY = 720;
		fireEvent.scroll(document);
	});
	fireEvent.click(screen.getByRole("link", { name: "Matcha" }));
	await screen.findByRole("link", { name: "product.details.back" });
	await waitFor(() => expect(scrollY).toBe(0));
	fireEvent.click(screen.getByRole("link", { name: "product.details.back" }));
	await screen.findByRole("link", { name: "Matcha" });
	await waitFor(() => expect(scrollY).toBe(720));
	await act(async () => {
		await router.navigate({ to: "/", search: { search: "tea" } });
	});
	await waitFor(() => expect(scrollY).toBe(0));
	await act(async () => {
		vi.stubGlobal("scrollY", 350);
		scrollY = 350;
		fireEvent.scroll(document);
	});
	fireEvent.click(screen.getByRole("link", { name: "Matcha" }));
	await screen.findByRole("link", { name: "product.details.back" });
	await waitFor(() => expect(scrollY).toBe(0));
	await act(async () => router.history.back());
	await screen.findByRole("link", { name: "Matcha" });
	await waitFor(() => expect(scrollY).toBe(350));
	client.clear();
});
