// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductPreview from "@/features/products/catalog/ProductPreview";
import { Store } from "@/features/products/model/product-values";
import type { ActiveCatalogProduct as PublicProduct } from "@/features/products/products.contracts";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	),
}));
vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
const product: PublicProduct = {
	id: "one",
	releaseDate: null,
	title: { ja: "おにぎり", en: "Rice ball" },
	description: { ja: "説明", en: "Salmon filling" },
	price: 220,
	images: ["https://example.test/rice.jpg"],
	url: "https://example.test/product",
	store: Store.LAWSON,
};
beforeEach(() => {
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
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	document.body.style.overflow = "";
});
describe("product preview", () => {
	it("labels the modal, locks scrolling, and restores it and focus when dismissed", () => {
		const trigger = document.createElement("button");
		document.body.append(trigger);
		trigger.focus();
		document.body.style.overflow = "auto";
		const close = vi.fn();
		const view = render(
			<ProductPreview product={product} filters={{}} onClose={close} />,
		);
		expect(screen.getByRole("dialog", { name: "Rice ball" })).toBeTruthy();
		expect(document.body.style.overflow).toBe("hidden");
		fireEvent.click(
			screen.getByRole("button", { name: "product.details.close" }),
		);
		expect(close).toHaveBeenCalledOnce();
		view.unmount();
		expect(document.body.style.overflow).toBe("auto");
		expect(document.activeElement).toBe(trigger);
		trigger.remove();
	});
	it("shows a useful fallback when a product photograph fails", () => {
		render(
			<ProductPreview product={product} filters={{}} onClose={() => {}} />,
		);
		fireEvent.error(screen.getByRole("img", { name: "Rice ball" }));
		expect(screen.getByText("product.noImage")).toBeTruthy();
	});
});
