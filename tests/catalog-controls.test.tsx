// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import CatalogControls from "@/features/products/catalog/CatalogControls";
import ProductFilterDrawer from "@/features/products/catalog/CatalogFilters";
import type { ProductFilters } from "@/features/products/data/product-queries";
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
		expect(screen.getByRole("alert").textContent).toBe(
			"product.filters.priceRangeError",
		);
		expect(
			screen
				.getByRole("button", { name: "product.filters.apply" })
				.hasAttribute("disabled"),
		).toBe(true);
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
