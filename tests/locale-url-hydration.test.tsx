// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { lazy, Suspense } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { useLocaleUrl } from "@/use-locale-url";

const state = vi.hoisted(() => ({ lang: undefined as string | undefined }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({
	useRouter: () => ({}),
	useRouterState: () => state.lang,
}));
vi.mock("react-i18next", () => ({
	useTranslation: () => ({ i18n: { language: "ja" } }),
}));
vi.mock("@/locale-navigation", () => ({ navigateLocale: navigate }));
let root: Root | undefined;
afterEach(async () => {
	await act(async () => root?.unmount());
	root = undefined;
	document.body.innerHTML = "";
	state.lang = undefined;
	navigate.mockClear();
});
function Page() {
	useLocaleUrl();
	return <a href="/products/example">Product</a>;
}
it("waits for a lazy SSR page to hydrate before normalizing its locale URL", async () => {
	let resolve!: (value: { default: typeof Page }) => void;
	const LazyPage = lazy(
		() =>
			new Promise<{ default: typeof Page }>((done) => {
				resolve = done;
			}),
	);
	const container = document.createElement("div");
	container.innerHTML = renderToString(
		<Suspense>
			<Page />
		</Suspense>,
	);
	document.body.append(container);
	const recover = vi.fn();
	await act(async () => {
		root = hydrateRoot(
			container,
			<Suspense>
				<LazyPage />
			</Suspense>,
			{ onRecoverableError: recover },
		);
	});
	expect(navigate).not.toHaveBeenCalled();
	expect(container.querySelector("a")?.getAttribute("href")).toBe(
		"/products/example",
	);
	await act(async () => resolve({ default: Page }));
	expect(navigate).toHaveBeenCalledOnce();
	expect(navigate).toHaveBeenCalledWith(expect.anything(), "ja");
	expect(recover).not.toHaveBeenCalled();
});
it("leaves an explicit locale unchanged after hydration", async () => {
	state.lang = "en";
	const container = document.createElement("div");
	container.innerHTML = renderToString(<Page />);
	document.body.append(container);
	await act(async () => {
		root = hydrateRoot(container, <Page />);
	});
	expect(navigate).not.toHaveBeenCalled();
});
