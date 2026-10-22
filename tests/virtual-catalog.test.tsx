// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import VirtualCatalog from "@/features/products/catalog/VirtualCatalog";
import type { ActiveCatalogProduct } from "@/features/products/products.contracts";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";

const read = vi.hoisted(() => vi.fn());
vi.mock("@/features/products/data/products-http-client", () => ({
	getProductsPage: read,
}));
vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
vi.mock("@/features/products/catalog/ProductCard", () => ({
	default: ({ product }: { product: ActiveCatalogProduct }) => (
		<a href={`/products/${product.id}`} data-product-id={product.id}>
			{product.id}
		</a>
	),
}));
const first = {
	products: Array.from({ length: 20 }, (_, i) =>
		catalogProduct({ id: `first-${i}` }),
	),
	nextCursor: "page-2",
};
const second = {
	products: Array.from({ length: 20 }, (_, i) =>
		catalogProduct({ id: `second-${i}` }),
	),
};
const observers: {
	active: boolean;
	target?: Element;
	callback: IntersectionObserverCallback;
}[] = [];
beforeEach(() => {
	read.mockReset();
	vi.stubGlobal("scrollTo", vi.fn());
	observers.length = 0;
	sessionStorage.clear();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			disconnect() {}
		},
	);
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			entry: {
				active: boolean;
				target?: Element;
				callback: IntersectionObserverCallback;
			};
			constructor(callback: IntersectionObserverCallback) {
				this.entry = { active: true, callback };
				observers.push(this.entry);
			}
			observe(target: Element) {
				this.entry.target = target;
			}
			disconnect() {
				this.entry.active = false;
			}
		},
	);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});
async function intersect() {
	await act(async () => {
		for (const o of observers.filter(
			(o) => o.active && o.target?.querySelector("button"),
		))
			o.callback(
				[{ isIntersecting: true } as IntersectionObserverEntry],
				{} as IntersectionObserver,
			);
	});
}
it("deduplicates repeated observer events and aborts a page request when leaving", async () => {
	read.mockImplementation(() => new Promise(() => {}));
	const view = render(
		<VirtualCatalog
			firstPage={first}
			filters={{}}
			paused={false}
			onPreview={vi.fn()}
		/>,
	);
	await intersect();
	await intersect();
	expect(read).toHaveBeenCalledTimes(1);
	expect(read.mock.calls[0][0]).toBe("page-2");
	const signal = read.mock.calls[0][2] as AbortSignal;
	expect(signal.aborted).toBe(false);
	view.unmount();
	expect(signal.aborted).toBe(true);
});
it("keeps readable products after a paging failure, pauses automatic fetching and retries explicitly", async () => {
	read.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(second);
	render(
		<VirtualCatalog
			firstPage={first}
			filters={{}}
			paused={false}
			onPreview={vi.fn()}
		/>,
	);
	await intersect();
	await screen.findByRole("alert");
	expect(screen.getByRole("link", { name: "first-0" })).toBeTruthy();
	await intersect();
	expect(read).toHaveBeenCalledTimes(1);
	fireEvent.click(screen.getByRole("button", { name: "product.retry" }));
	await waitFor(() =>
		expect(document.querySelector('[data-known-pages="2"]')).toBeTruthy(),
	);
	expect(read).toHaveBeenCalledTimes(2);
});
it("manual mode and an open dialog pause automatic loading", async () => {
	read.mockResolvedValue(second);
	const view = render(
		<VirtualCatalog
			firstPage={first}
			filters={{}}
			paused={false}
			onPreview={vi.fn()}
		/>,
	);
	fireEvent.click(
		screen.getByRole("checkbox", { name: "product.manualLoading" }),
	);
	await intersect();
	expect(read).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "product.loadMore" }));
	await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
	view.unmount();
	read.mockClear();
	sessionStorage.clear();
	render(
		<VirtualCatalog
			firstPage={first}
			filters={{}}
			paused
			onPreview={vi.fn()}
		/>,
	);
	await intersect();
	expect(read).not.toHaveBeenCalled();
});
