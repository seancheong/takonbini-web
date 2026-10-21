// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CatalogControls from "@/features/products/catalog/CatalogControls";
import { Category, Store } from "@/features/products/products.contracts";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { label?: string }) =>
			options?.label ? `${key}: ${options.label}` : key,
	}),
}));
let notify: IntersectionObserverCallback;
const disconnect = vi.fn();
beforeEach(() => {
	vi.stubGlobal(
		"IntersectionObserver",
		class {
			constructor(callback: IntersectionObserverCallback) {
				notify = callback;
			}
			observe = vi.fn();
			disconnect = disconnect;
		},
	);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

function observeControls(bottom: number, isIntersecting: boolean) {
	act(() =>
		notify(
			[
				{
					isIntersecting,
					boundingClientRect: { bottom },
				} as IntersectionObserverEntry,
			],
			{} as IntersectionObserver,
		),
	);
}

it("reveals the bar only after controls pass above the header and hides it when they return", () => {
	render(
		<CatalogControls filters={{}} onApply={vi.fn()} onOpenFilters={vi.fn()}>
			<button type="button">Original filters</button>
		</CatalogControls>,
	);
	expect(screen.queryByRole("region")).toBeNull();
	observeControls(1200, false);
	expect(screen.queryByRole("region")).toBeNull();
	observeControls(-1, false);
	expect(
		screen.getByRole("region", { name: "product.filters.appliedFilters" }),
	).toBeTruthy();
	observeControls(100, true);
	expect(screen.queryByRole("region")).toBeNull();
});

it("opens filters from the bar and removes an applied chip without discarding other filters", () => {
	const onApply = vi.fn();
	const open = vi.fn();
	const filters = {
		stores: [Store.LAWSON],
		categories: [Category.BENTO],
		maxPrice: 0,
		search: "rice",
		limit: 20,
	};
	render(
		<CatalogControls filters={filters} onApply={onApply} onOpenFilters={open}>
			<button type="button">Original filters</button>
		</CatalogControls>,
	);
	observeControls(-1, false);
	const bar = within(screen.getByRole("region"));
	fireEvent.click(bar.getByRole("button", { name: /product.filters.title/ }));
	expect(open).toHaveBeenCalledOnce();
	fireEvent.click(
		bar.getByRole("button", {
			name: "product.removeFilter: product.category.bento",
		}),
	);
	expect(onApply).toHaveBeenCalledWith({ ...filters, categories: [] });
	expect(bar.getByText("product.filters.maxPrice: ¥0")).toBeTruthy();
});

it("disconnects observation on unmount", () => {
	const view = render(
		<CatalogControls filters={{}} onApply={vi.fn()} onOpenFilters={vi.fn()}>
			{null}
		</CatalogControls>,
	);
	view.unmount();
	expect(disconnect).toHaveBeenCalledOnce();
});

it("focuses either sticky launcher before opening when pointer clicks do not focus buttons", () => {
	const focused: (Element | null)[] = [];
	render(
		<CatalogControls
			filters={{}}
			onApply={vi.fn()}
			onOpenFilters={() => focused.push(document.activeElement)}
		>
			{null}
		</CatalogControls>,
	);
	observeControls(-1, false);
	const bar = within(screen.getByRole("region"));
	const launchers = [
		bar.getByRole("button", { name: "product.filters.title" }),
		bar.getByRole("button", { name: "product.filters.noFilters" }),
	];
	for (const launcher of launchers) fireEvent.click(launcher);
	expect(focused).toEqual(launchers);
});
