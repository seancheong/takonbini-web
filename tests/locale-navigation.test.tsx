// @vitest-environment jsdom
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	retainSearchParams,
} from "@tanstack/react-router";
import { expect, it } from "vitest";
import { catalogSearch } from "@/features/products/catalog/catalog-search";
import { navigateLocale } from "@/locale-navigation";
import { parseLocaleSearch } from "@/localization";

it("retains the locale on filter/detail links, isolates filter data, and preserves a masked modal on locale changes", async () => {
	const root = createRootRoute({
		validateSearch: parseLocaleSearch,
		search: { middlewares: [retainSearchParams(["lang"])] },
	});
	const catalog = createRoute({
		getParentRoute: () => root,
		path: "/",
		validateSearch: catalogSearch.parse,
	});
	const detail = createRoute({
		getParentRoute: () => root,
		path: "/products/$id",
		validateSearch: catalogSearch.parse,
	});
	const history = createMemoryHistory({
		initialEntries: ["/?lang=ja&search=tea"],
	});
	const router = createRouter({
		routeTree: root.addChildren([catalog, detail]),
		history,
	});
	await router.load();
	const filtered = router.buildLocation({
		to: "/",
		search: { search: "milk" },
	});
	expect(filtered.search).toMatchObject({ lang: "ja", search: "milk" });
	expect(catalogSearch.parse(filtered.search)).not.toHaveProperty("lang");
	expect(
		router.buildLocation({
			to: "/products/$id",
			params: { id: "p1" },
			search: { search: "tea" },
		}).search,
	).toEqual(expect.objectContaining({ lang: "ja" }));
	await router.navigate({
		to: "/",
		search: true,
		state: { productModalId: "p1", catalogScrollY: 400 },
		resetScroll: false,
		mask: {
			to: "/products/$id",
			params: { id: "p1" },
			search: { search: "tea" },
			unmaskOnReload: true,
		},
	});
	const entries = history.length;
	await navigateLocale(router, "zh");
	expect(history.length).toBe(entries);
	expect(router.state.location.pathname).toBe("/");
	expect(router.state.location.search).toMatchObject({
		lang: "zh",
		search: "tea",
	});
	expect(router.state.location.state).toMatchObject({
		productModalId: "p1",
		catalogScrollY: 400,
	});
	expect(router.state.location.maskedLocation?.search.lang).toBe("zh");
	expect(history.location.pathname).toBe("/products/p1");
	expect(history.location.search).toContain("lang=zh");
});
