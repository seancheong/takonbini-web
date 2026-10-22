import { afterEach, describe, expect, it, vi } from "vitest";
import {
	parseList,
	parseNumber,
} from "@/features/products/catalog/query-parsers";
import { catalogSearch, productQueries } from "@/features/products/products";
import type { ProductFilters } from "@/features/products/products.contracts";
import { Category, Store } from "@/features/products/products.contracts";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";
import { Route as productsRoute } from "@/routes/api.products";
import { Route as productRoute } from "@/routes/api.products.$id";
import { Route as catalogRoute } from "@/routes/index";
import { Route as detailRoute } from "@/routes/products.$id";
import { Route as sitemapRoute } from "@/routes/sitemap[.]xml";
import imageHandler from "@/server/product-image-handler";

vi.mock("@tanstack/react-start", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-start")>()),
	createIsomorphicFn: () => ({
		server: (server: (...args: unknown[]) => unknown) => ({
			client:
				(client: (...args: unknown[]) => unknown) =>
				(...args: unknown[]) =>
					(typeof window === "undefined" ? server : client)(...args),
		}),
	}),
}));

type HandlerInput = { request: Request; params: Record<string, string> };
type GetHandler = (input: HandlerInput) => Promise<Response>;
type RouteWithHandlers = {
	options: {
		server?: {
			handlers?: (input: {
				createHandlers: <T>(handlers: T) => T;
			}) => Record<string, unknown>;
		};
	};
};

const getHandler = (route: unknown): GetHandler => {
	const typedRoute = route as RouteWithHandlers;
	const handlers = typedRoute.options.server?.handlers?.({
		createHandlers: <T>(value: T) => value,
	});
	if (typeof handlers?.GET !== "function") {
		throw new Error("Expected a GET route handler");
	}
	return handlers.GET as GetHandler;
};

const request = (url: string) => new Request(url);

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
});

describe("catalog query parsing and requests", () => {
	it("validates the catalog URL state against supported filters", () => {
		const validateSearch = catalogRoute.options.validateSearch as (
			search: Record<string, unknown>,
		) => ProductFilters;
		expect(
			validateSearch({
				search: "  tea  ",
				stores: ["Lawson", "unknown"],
				categories: "Sweets,invalid",
				regions: "Kanto,unknown",
				includeSoon: "true",
				minPrice: "12.5",
				maxPrice: "bad",
			}),
		).toEqual({
			search: "  tea  ",
			stores: [Store.LAWSON],
			categories: [Category.SWEETS],
			regions: ["Kanto"],
			includeSoon: true,
			minPrice: 12.5,
			maxPrice: undefined,
		});
		expect(validateSearch({ includeSoon: "false", stores: "unknown" })).toEqual(
			{
				search: undefined,
				stores: undefined,
				categories: undefined,
				regions: undefined,
				includeSoon: undefined,
				minPrice: undefined,
				maxPrice: undefined,
			},
		);
	});

	it("encodes applied URL filters without a page-size override or empty selections", () => {
		const search = catalogSearch.encode({
			limit: 100,
			search: "  tea  ",
			stores: [],
			categories: [],
			regions: [],
			includeSoon: false,
			minPrice: 0,
		});
		expect(search).toEqual({
			search: "tea",
			stores: undefined,
			categories: undefined,
			regions: undefined,
			includeSoon: undefined,
			minPrice: 0,
			maxPrice: undefined,
		});
		expect(search).not.toHaveProperty("limit");
		expect(catalogSearch.normalize(search)).toMatchObject({
			limit: 20,
			search: "tea",
			minPrice: 0,
		});
	});

	it("uses the current filters as catalog loader dependencies", () => {
		const loaderDeps = catalogRoute.options.loaderDeps as (input: {
			search: ProductFilters;
		}) => { search: ProductFilters };
		const search = { stores: [Store.LAWSON], search: "tea" };
		expect(loaderDeps({ search })).toEqual({ search });
	});

	it("prefetches catalog data with trimmed search and the default page size", async () => {
		const prefetchInfiniteQuery = vi.fn();
		const loader = catalogRoute.options.loader as unknown as (input: {
			context: {
				queryClient: { prefetchInfiniteQuery: typeof prefetchInfiniteQuery };
			};
			deps: { search: ProductFilters };
		}) => Promise<void>;
		await loader({
			context: { queryClient: { prefetchInfiniteQuery } },
			deps: { search: { search: "  tea  ", stores: [Store.LAWSON] } },
		});

		expect(prefetchInfiniteQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				queryKey: [
					"products",
					"infinite",
					{ limit: 20, search: "tea", stores: [Store.LAWSON] },
				],
			}),
		);
	});

	it("keeps detail navigation loaders tied to the selected product id", async () => {
		const ensureQueryData = vi.fn().mockResolvedValue({ id: "product-1" });
		const loader = detailRoute.options.loader as unknown as (input: {
			context: { queryClient: { ensureQueryData: typeof ensureQueryData } };
			params: { id: string };
		}) => Promise<void>;
		await loader({
			context: { queryClient: { ensureQueryData } },
			params: { id: "product-1" },
		});
		expect(ensureQueryData).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: ["products", "byId", "product-1"] }),
		);
	});

	it("keeps only supported list values and finite numbers", () => {
		expect(
			parseList("SevenEleven, invalid, Lawson", Object.values(Store)),
		).toEqual([Store.SEVEN_ELEVEN, Store.LAWSON]);
		expect(parseList(["Sweets", "unknown"], Object.values(Category))).toEqual([
			Category.SWEETS,
		]);
		expect(parseList("invalid", Object.values(Store))).toBeUndefined();
		expect(parseNumber("12.5")).toBe(12.5);
		expect(parseNumber("Infinity")).toBeUndefined();
	});

	it("encodes the active filters and cursor for the catalog API", async () => {
		vi.stubEnv("PRODUCTS_API_URL", "https://catalog.test");
		vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ products: [], nextCursor: "page-2" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);
		const filters: ProductFilters = {
			search: "  matcha  ",
			stores: [Store.LAWSON],
			categories: [Category.SWEETS],
			regions: ["Kanto"],
			minPrice: 100,
			maxPrice: 500,
			limit: 10,
			includeSoon: true,
		};
		const query = productQueries.catalog(filters);
		await query.queryFn({ pageParam: "page-1" });

		const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
		expect(calledUrl.origin).toBe("https://catalog.test");
		expect(calledUrl.pathname).toBe("/products");
		expect(Object.fromEntries(calledUrl.searchParams)).toEqual({
			cursor: "page-1",
			limit: "10",
			search: "  matcha  ",
			status: "all",
			minPrice: "100",
			maxPrice: "500",
			stores: Store.LAWSON,
			categories: Category.SWEETS,
			regions: "Kanto",
		});
		expect(query.getNextPageParam({ products: [], nextCursor: "page-2" })).toBe(
			"page-2",
		);
	});

	it("uses same-origin browser requests without exposing the upstream API key", async () => {
		vi.stubGlobal("window", {
			location: { origin: "https://web.example.test" },
		});
		vi.stubEnv("PRODUCTS_API_KEY", "server-only-secret");
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ products: [] }), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);
		const query = productQueries.catalog({ limit: 20 });
		await query.queryFn({ pageParam: undefined });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://web.example.test/api/products?limit=20&status=allWithoutSoon",
			{ signal: undefined },
		);
		expect(fetchMock.mock.calls[0]).toHaveLength(2);
	});

	it("uses a stable query key when equivalent filters list values in a different order", () => {
		const left = productQueries.catalog({
			stores: [Store.LAWSON, Store.SEVEN_ELEVEN],
		});
		const right = productQueries.catalog({
			stores: [Store.SEVEN_ELEVEN, Store.LAWSON],
		});
		expect(left.queryKey).toEqual(right.queryKey);
	});
});

describe("same-origin product API routes", () => {
	it("forwards the list query and API key server-side, preserving upstream response", async () => {
		vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
		vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
		const upstream = new Response('{"products":[]}', {
			status: 206,
			headers: { "content-type": "application/json", "x-upstream": "kept" },
		});
		const fetchMock = vi.fn().mockResolvedValue(upstream);
		vi.stubGlobal("fetch", fetchMock);

		const response = await getHandler(productsRoute)({
			request: request(
				"https://web.example.test/api/products?limit=7&status=all",
			),
			params: {},
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.test/products?limit=7&status=all",
			{ headers: { "x-api-key": "test-secret" } },
		);
		expect(response.status).toBe(206);
		expect(response.headers.get("x-upstream")).toBe("kept");
		expect(await response.text()).toBe('{"products":[]}');
	});

	it("forwards a product id and query to the upstream detail route", async () => {
		vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test/");
		vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
		const product = catalogProduct({ id: "p/1" });
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response(JSON.stringify(product), { status: 200 }),
			);
		vi.stubGlobal("fetch", fetchMock);

		const response = await getHandler(productRoute)({
			request: request(
				"https://web.example.test/api/products/p%2F1?language=en",
			),
			params: { id: "p/1" },
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.test//products/p/1?language=en",
			{ headers: { "x-api-key": "test-secret" } },
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(product);
	});

	it("fails closed when upstream credentials are missing", async () => {
		vi.stubEnv("PRODUCTS_API_URL", "");
		vi.stubEnv("PRODUCTS_API_KEY", "");
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const response = await getHandler(productsRoute)({
			request: request("https://web.example.test/api/products"),
			params: {},
		});

		expect(response.status).toBe(500);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(await response.text()).not.toContain("test-secret");
	});
});

describe("image proxy", () => {
	it.each([
		["missing", "https://web.example.test/api/image", 400],
		["malformed", "https://web.example.test/api/image?url=%25", 400],
		[
			"unsupported protocol",
			"https://web.example.test/api/image?url=data%3Aimage%2Fpng%2Cabc",
			400,
		],
	])("rejects a %s target", async (_label, url, expectedStatus) => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const response = await imageHandler.fetch(request(url));
		expect(response.status).toBe(expectedStatus);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("streams allowed images with cache and validator headers", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), {
				status: 200,
				headers: {
					"content-type": "image/webp",
					etag: '"img-v1"',
					"last-modified": "Mon, 01 Jan 2024 00:00:00 GMT",
					"set-cookie": "private=1",
				},
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const response = await imageHandler.fetch(
			request(
				"https://web.example.test/api/image?url=https%3A%2F%2Fwww.family.co.jp%2Fp.webp",
			),
		);

		expect(fetchMock).toHaveBeenCalledWith(
			new URL("https://www.family.co.jp/p.webp"),
			{
				headers: { "user-agent": "TakonbiniImageProxy/1.0" },
				redirect: "manual",
				signal: expect.any(AbortSignal),
			},
		);
		expect(response.headers.get("content-type")).toBe("image/png");
		expect(response.headers.get("etag")).toBe('"img-v1"');
		expect(response.headers.get("last-modified")).toBe(
			"Mon, 01 Jan 2024 00:00:00 GMT",
		);
		expect(response.headers.get("cache-control")).toBe(
			"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
		);
		expect(response.headers.has("set-cookie")).toBe(false);
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(
			new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
		);
	});
});

describe("sitemap", () => {
	it("walks product pages and emits escaped absolute URLs", async () => {
		vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
		vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
		vi.stubEnv("SITE_URL", "https://takonbini.example.test/");
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({ products: [{ id: "one&two" }], nextCursor: "next" }),
					{
						status: 200,
						headers: { "content-type": "application/json" },
					},
				),
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ products: [{ id: "three" }] }), {
					status: 200,
					headers: { "content-type": "application/json" },
				}),
			);
		vi.stubGlobal("fetch", fetchMock);

		const response = await getHandler(sitemapRoute)({
			request: request("https://web.example.test/sitemap.xml"),
			params: {},
		});

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"https://api.example.test/products?status=all&limit=100",
			{
				headers: { "x-api-key": "test-secret" },
				signal: expect.any(AbortSignal),
			},
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"https://api.example.test/products?status=all&limit=100&cursor=next",
			{
				headers: { "x-api-key": "test-secret" },
				signal: expect.any(AbortSignal),
			},
		);
		expect(response.headers.get("content-type")).toBe(
			"application/xml; charset=utf-8",
		);
		const xml = await response.text();
		expect(xml).toContain("https://takonbini.example.test/");
		expect(xml).toContain("https://takonbini.example.test/products/one%26two");
		expect(xml).toContain("https://takonbini.example.test/products/three");
	});

	it("returns unavailable without publishing a homepage-only sitemap when API credentials are missing", async () => {
		vi.stubEnv("PRODUCTS_API_URL", "");
		vi.stubEnv("PRODUCTS_API_KEY", "");
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		const response = await getHandler(sitemapRoute)({
			request: request("http://preview.example.test/sitemap.xml"),
			params: {},
		});

		expect(response.status).toBe(503);
		expect(await response.text()).not.toContain("<urlset");
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it("returns unavailable rather than a partial sitemap after a later upstream HTTP failure", async () => {
		vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
		vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						products: [{ id: "first-page" }],
						nextCursor: "next",
					}),
				),
			)
			.mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
		vi.stubGlobal("fetch", fetchMock);
		const response = await getHandler(sitemapRoute)({
			request: request("https://web.example.test/sitemap.xml"),
			params: {},
		});
		expect(response.status).toBe(503);
		expect(await response.text()).not.toContain("/products/first-page");
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("stops repeated cursors and returns unavailable", async () => {
		vi.stubEnv("PRODUCTS_API_URL", "https://api.example.test");
		vi.stubEnv("PRODUCTS_API_KEY", "test-secret");
		const fetchMock = vi
			.fn()
			.mockImplementation(
				async () =>
					new Response(JSON.stringify({ products: [], nextCursor: "next" })),
			);
		vi.stubGlobal("fetch", fetchMock);
		const response = await getHandler(sitemapRoute)({
			request: request("https://web.example.test/sitemap.xml"),
			params: {},
		});
		expect(response.status).toBe(503);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
