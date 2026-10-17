// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import CatalogControls from "@/features/products/catalog/CatalogControls";
import ProductFilterDrawer from "@/features/products/catalog/CatalogFilters";
import type { ProductFilters } from "@/features/products/products.contracts";
import { Category, Store } from "@/features/products/products.contracts";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { label?: string }) =>
			options?.label ? `${key}: ${options.label}` : key,
	}),
}));

beforeAll(() => {
	HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close = function () {
		this.removeAttribute("open");
	};
});
afterEach(cleanup);

function Filters({ onApply }: { onApply: (filters: ProductFilters) => void }) {
	const [filters, setFilters] = useState<ProductFilters>({
		stores: [Store.LAWSON],
	});
	const [open, setOpen] = useState(false);
	return (
		<ProductFilterDrawer
			filters={filters}
			setFilters={setFilters}
			isFilterOpen={open}
			setIsFilterOpen={setOpen}
			onApply={onApply}
			onReset={() => setFilters({})}
		/>
	);
}

describe("catalog discovery", () => {
	it("shows pending search feedback and prevents another submit", () => {
		const apply = vi.fn();
		render(
			<CatalogControls filters={{}} onApply={apply} isPending>
				{null}
			</CatalogControls>,
		);
		const button = screen.getByRole("button", {
			name: "product.filters.searchPending",
		});
		expect(button.hasAttribute("disabled")).toBe(true);
		fireEvent.click(button);
		expect(apply).not.toHaveBeenCalled();
	});
	it("submits a trimmed search while preserving applied filters", () => {
		const apply = vi.fn();
		render(
			<CatalogControls
				filters={{ stores: [Store.LAWSON], categories: [Category.SWEETS] }}
				onApply={apply}
			>
				{null}
			</CatalogControls>,
		);
		fireEvent.change(screen.getByRole("searchbox"), {
			target: { value: "  matcha  " },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.searchLabel" }),
		);
		expect(apply).toHaveBeenCalledWith({
			stores: [Store.LAWSON],
			categories: [Category.SWEETS],
			search: "matcha",
		});
	});

	it("removes one applied filter without clearing the others", () => {
		const apply = vi.fn();
		render(
			<CatalogControls
				filters={{ search: "tea", stores: [Store.LAWSON], minPrice: 0 }}
				onApply={apply}
			>
				{null}
			</CatalogControls>,
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "product.removeFilter: product.store.lawson",
			}),
		);
		expect(apply).toHaveBeenCalledWith({
			search: "tea",
			stores: [],
			minPrice: 0,
		});
		fireEvent.click(
			screen.getByRole("button", { name: "product.clearFilters" }),
		);
		expect(apply).toHaveBeenLastCalledWith({ limit: undefined });
	});

	it("replaces the store selection while retaining search", () => {
		const apply = vi.fn();
		render(
			<CatalogControls
				filters={{ search: "tea", stores: [Store.LAWSON] }}
				onApply={apply}
			>
				{null}
			</CatalogControls>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "product.store.familyMart" }),
		);
		expect(apply).toHaveBeenCalledWith({
			search: "tea",
			stores: [Store.FAMILY_MART],
		});
	});
});

describe("advanced catalog filters", () => {
	it.each(["minPrice", "maxPrice"] as const)(
		"rejects native incomplete input in %s and allows correction",
		(field) => {
			const apply = vi.fn();
			render(<Filters onApply={apply} />);
			fireEvent.click(
				screen.getByRole("button", { name: "product.filters.title" }),
			);
			const input = screen.getByLabelText(`product.filters.${field}`);
			Object.defineProperty(input, "validity", {
				configurable: true,
				value: { badInput: true },
			});
			fireEvent.click(
				screen.getByRole("button", { name: "product.filters.apply" }),
			);
			expect(apply).not.toHaveBeenCalled();
			expect(screen.getByRole("alert").textContent).toBe(
				"product.filters.priceIntegerError",
			);
			expect(input.getAttribute("aria-invalid")).toBe("true");
			expect(document.activeElement).toBe(input);
			Object.defineProperty(input, "validity", {
				configurable: true,
				value: { badInput: false },
			});
			fireEvent.change(input, { target: { value: "400" } });
			expect(screen.queryByRole("alert")).toBeNull();
			fireEvent.click(
				screen.getByRole("button", { name: "product.filters.apply" }),
			);
			expect(apply).toHaveBeenCalledWith({
				stores: [Store.LAWSON],
				[field]: 400,
			});
		},
	);
	it("reveals an invalid range on submit and focuses its correction", () => {
		const apply = vi.fn();
		render(<Filters onApply={apply} />);
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.title" }),
		);
		fireEvent.change(screen.getByLabelText("product.filters.minPrice"), {
			target: { value: "500" },
		});
		fireEvent.change(screen.getByLabelText("product.filters.maxPrice"), {
			target: { value: "100" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.apply" }),
		);
		expect(apply).not.toHaveBeenCalled();
		expect(screen.getByRole("alert").textContent).toBe(
			"product.filters.priceRangeError",
		);
		expect(document.activeElement).toBe(
			screen.getByLabelText("product.filters.maxPrice"),
		);
	});
	it("shows the applied count independently of staged selections", () => {
		render(
			<ProductFilterDrawer
				filters={{ stores: [Store.LAWSON] }}
				activeCount={3}
				setFilters={vi.fn()}
				isFilterOpen={false}
				setIsFilterOpen={vi.fn()}
				onApply={vi.fn()}
				onReset={vi.fn()}
			/>,
		);
		expect(screen.getByRole("button").textContent).toBe(
			"product.filters.title3",
		);
	});
	it("opens a modal and restores page scrolling and focus on cancellation", () => {
		const apply = vi.fn();
		render(<Filters onApply={apply} />);
		const trigger = screen.getByRole("button", {
			name: "product.filters.title",
		});
		trigger.focus();
		fireEvent.click(trigger);
		const dialog = screen.getByRole("dialog", {
			name: "product.filters.title",
		});
		expect(dialog.hasAttribute("open")).toBe(true);
		expect(document.documentElement.style.overflow).toBe("hidden");
		expect(document.body.style.overflow).toBe("");
		fireEvent(
			dialog,
			new Event("cancel", { bubbles: false, cancelable: true }),
		);
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(document.documentElement.style.overflow).toBe("");
		expect(document.activeElement).toBe(trigger);
		expect(apply).not.toHaveBeenCalled();
	});
	it("keeps draft selections unapplied until submission", () => {
		const apply = vi.fn();
		render(<Filters onApply={apply} />);
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.title" }),
		);
		fireEvent.click(
			screen.getByRole("checkbox", { name: "product.category.sweets" }),
		);
		expect(apply).not.toHaveBeenCalled();
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.apply" }),
		);
		expect(apply).toHaveBeenCalledWith({
			stores: [Store.LAWSON],
			categories: [Category.SWEETS],
		});
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("rejects an inverted price range and recovers when corrected", () => {
		render(<Filters onApply={vi.fn()} />);
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.title" }),
		);
		fireEvent.change(screen.getByLabelText("product.filters.minPrice"), {
			target: { value: "500" },
		});
		fireEvent.change(screen.getByLabelText("product.filters.maxPrice"), {
			target: { value: "100" },
		});
		expect(screen.queryByRole("alert")).toBeNull();
		fireEvent.blur(screen.getByLabelText("product.filters.maxPrice"));
		expect(
			screen
				.getByLabelText("product.filters.minPrice")
				.getAttribute("aria-invalid"),
		).toBe("false");
		expect(
			screen
				.getByLabelText("product.filters.maxPrice")
				.getAttribute("aria-invalid"),
		).toBe("true");
		expect(screen.getByRole("alert").textContent).toBe(
			"product.filters.priceRangeError",
		);
		expect(
			screen
				.getByRole("button", { name: "product.filters.apply" })
				.hasAttribute("disabled"),
		).toBe(false);
		fireEvent.change(screen.getByLabelText("product.filters.maxPrice"), {
			target: { value: "600" },
		});
		expect(screen.queryByRole("alert")).toBeNull();
		expect(
			screen
				.getByRole("button", { name: "product.filters.apply" })
				.hasAttribute("disabled"),
		).toBe(false);
	});
});
