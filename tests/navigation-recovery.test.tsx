// @vitest-environment jsdom
import {
	createLazyRoute,
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
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { afterEach, expect, it, vi } from "vitest";
import en from "@/locales/en";
import ja from "@/locales/ja";
import zh from "@/locales/zh";
import { Route as AppRoot } from "@/routes/__root";

vi.mock("@/components/StyleXDevStyles", () => ({
	StyleXDevStyles: () => null,
}));

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});
it.each(["startup request", "route chunk"])(
	"offers usable recovery after a failed %s",
	async (kind) => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const i18n = createInstance();
		await i18n.init({ lng: "en", resources: { en }, initAsync: false });
		let fail = true;
		const root = createRootRoute({
			component: Outlet,
			shellComponent: ({ children }) => <main>{children}</main>,
			errorComponent: AppRoot.options.errorComponent,
			loader: () => {
				if (kind === "startup request" && fail)
					throw new TypeError("Failed to fetch");
				return {};
			},
		});
		const catalog = createRoute({
			getParentRoute: () => root,
			path: "/",
			component: () => <h1>Catalog</h1>,
		});
		const detail = createRoute({
			getParentRoute: () => root,
			path: "/products/$id",
		}).lazy(async () => {
			if (kind === "route chunk" && fail)
				throw new TypeError("Transient route-options failure");
			return createLazyRoute("/products/$id")({
				component: () => <h1 tabIndex={-1}>Recovered product</h1>,
			});
		});
		const router = createRouter({
			routeTree: root.addChildren([catalog, detail]),
			history: createMemoryHistory({
				initialEntries: ["/products/one?lang=en&search=tea"],
			}),
			defaultPendingMinMs: 0,
			defaultPendingMs: 0,
		});
		await router.load();
		render(
			<I18nextProvider i18n={i18n}>
				<RouterProvider router={router} />
			</I18nextProvider>,
		);
		let retry = await screen.findByRole("button", { name: "Try again" });
		await act(async () => {
			fireEvent.click(retry);
		});
		retry = await screen.findByRole("button", { name: "Try again" });
		await waitFor(() => expect(router.state.status).toBe("idle"));
		expect(screen.queryByText("Something went wrong!")).toBeNull();
		fail = false;
		fireEvent.click(retry);
		await screen.findByRole("heading", { name: "Recovered product" });
		expect(router.state.location.searchStr).toContain("search=tea");
		await waitFor(() =>
			expect(document.activeElement?.textContent).toBe("Recovered product"),
		);
	},
);

it.each([false, true])(
	"reuses successful startup data on navigation (cache=%s)",
	async (cache) => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const i18n = createInstance();
		await i18n.init({ lng: "en", resources: { en }, initAsync: false });
		let offline = false;
		const startup = vi.fn(() => {
			if (offline) throw new TypeError("Failed to fetch");
			return {};
		});
		const root = createRootRoute({
			component: Outlet,
			loader: startup,
			staleTime: cache ? AppRoot.options.staleTime : 0,
			errorComponent: AppRoot.options.errorComponent,
		});
		const catalog = createRoute({
			getParentRoute: () => root,
			path: "/",
			component: () => <h1>Catalog</h1>,
		});
		const detail = createRoute({
			getParentRoute: () => root,
			path: "/products/$id",
			component: () => <h1>Product</h1>,
		});
		const router = createRouter({
			routeTree: root.addChildren([catalog, detail]),
			history: createMemoryHistory({ initialEntries: ["/"] }),
			defaultPendingMinMs: 0,
			defaultPendingMs: 0,
		});
		await router.load();
		render(
			<I18nextProvider i18n={i18n}>
				<RouterProvider router={router} />
			</I18nextProvider>,
		);
		await screen.findByRole("heading", { name: "Catalog" });
		await waitFor(() => expect(router.state.status).toBe("idle"));
		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(Date.now() + 1000);
		offline = true;
		await act(async () => {
			await router.navigate({ to: "/products/$id", params: { id: "one" } });
			await router.load();
		});
		if (cache) {
			await screen.findByRole("heading", { name: "Product" });
			expect(startup).toHaveBeenCalledOnce();
		} else {
			await screen.findByRole("button", { name: "Try again" });
			expect(startup.mock.calls.length).toBeGreaterThan(1);
		}
	},
);

it.each([
	["en", "This page could not be opened"],
	["ja", "ページを開けませんでした"],
	["zh", "無法開啟此頁面"],
])(
	"localizes startup recovery and preserves the catalog search (%s)",
	async (language, title) => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const i18n = createInstance();
		await i18n.init({ lng: "en", resources: { en, ja, zh }, initAsync: false });
		const root = createRootRoute({
			component: Outlet,
			errorComponent: AppRoot.options.errorComponent,
			loader: () => {
				throw new TypeError("private failure details");
			},
		});
		const catalog = createRoute({
			getParentRoute: () => root,
			path: "/",
			component: () => null,
		});
		const router = createRouter({
			routeTree: root.addChildren([catalog]),
			history: createMemoryHistory({
				initialEntries: [
					`/?lang=${language}&search=tea&stores=%5B%22Lawson%22%5D`,
				],
			}),
			defaultPendingMinMs: 0,
			defaultPendingMs: 0,
		});
		await router.load();
		render(
			<I18nextProvider i18n={i18n}>
				<RouterProvider router={router} />
			</I18nextProvider>,
		);
		const heading = await screen.findByRole("heading", { name: title });
		expect(document.activeElement).toBe(heading);
		expect(screen.queryByText("private failure details")).toBeNull();
		const back = screen.getByRole("link");
		const url = new URL(
			back.getAttribute("href") ?? "",
			"https://example.test",
		);
		expect(url.pathname).toBe("/");
		expect(url.searchParams.get("lang")).toBe(language);
		expect(url.searchParams.get("search")).toBe("tea");
		expect(url.searchParams.get("stores")).toContain("Lawson");
	},
);

it("exposes pending status and a catalog escape while a startup retry is slow", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
	const i18n = createInstance();
	await i18n.init({ lng: "en", resources: { en }, initAsync: false });
	let retrying = false;
	let release: () => void = () => {};
	const root = createRootRoute({
		component: Outlet,
		shellComponent: ({ children }) => <main>{children}</main>,
		errorComponent: AppRoot.options.errorComponent,
		pendingComponent: AppRoot.options.pendingComponent,
		loader: () => {
			if (!retrying) throw new TypeError("offline");
			return new Promise<void>((resolve) => {
				release = resolve;
			});
		},
	});
	const catalog = createRoute({
		getParentRoute: () => root,
		path: "/",
		component: () => <h1 tabIndex={-1}>Loaded catalog</h1>,
	});
	const router = createRouter({
		routeTree: root.addChildren([catalog]),
		history: createMemoryHistory({ initialEntries: ["/?lang=en"] }),
		defaultPendingMinMs: 0,
		defaultPendingMs: 0,
	});
	await router.load();
	render(
		<I18nextProvider i18n={i18n}>
			<RouterProvider router={router} />
		</I18nextProvider>,
	);
	const retry = await screen.findByRole("button", { name: "Try again" });
	retrying = true;
	fireEvent.click(retry);
	await screen.findByRole("heading", { name: "Opening page…", level: 1 });
	expect(screen.getByRole("link", { name: "Back to products" })).toBeTruthy();
	await act(async () => {
		release();
	});
	const heading = await screen.findByRole("heading", {
		name: "Loaded catalog",
	});
	await waitFor(() => expect(document.activeElement).toBe(heading));
});

it.each([
	"Failed to fetch dynamically imported module: /assets/detail.js",
	"error loading dynamically imported module: /assets/detail.js",
	"Importing a module script failed.",
])(
	"uses a deliberate reload for browser-cached import errors: %s",
	async (message) => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const i18n = createInstance();
		await i18n.init({ lng: "en", resources: { en }, initAsync: false });
		const root = createRootRoute({
			component: Outlet,
			errorComponent: AppRoot.options.errorComponent,
			loader: () => {
				throw new TypeError(message);
			},
		});
		const catalog = createRoute({
			getParentRoute: () => root,
			path: "/",
			component: () => null,
		});
		const router = createRouter({
			routeTree: root.addChildren([catalog]),
			history: createMemoryHistory({
				initialEntries: ["/?lang=en&search=tea"],
			}),
		});
		await router.load();
		render(
			<I18nextProvider i18n={i18n}>
				<RouterProvider router={router} />
			</I18nextProvider>,
		);
		const retry = await screen.findByRole("button", { name: "Try again" });
		const reload = vi.fn();
		const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
		vi.stubGlobal("window", { location: { reload } });
		try {
			fireEvent.click(retry);
			expect(reload).not.toHaveBeenCalled();
			expect(
				screen.getByText("You’re offline. Reconnect, then try again."),
			).toBeTruthy();
			online.mockReturnValue(true);
			fireEvent.click(retry);
			expect(reload).toHaveBeenCalledOnce();
			expect(router.state.location.searchStr).toContain("search=tea");
		} finally {
			vi.unstubAllGlobals();
		}
	},
);
