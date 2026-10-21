// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetailPending from "@/features/products/detail/ProductDetailPending";
import ProductPreview from "@/features/products/catalog/ProductPreview";
import { productByIdQueryOptions } from "@/features/products/data/product-queries";
import { Store } from "@/features/products/model/product-values";
import type { ActiveCatalogProduct as PublicProduct } from "@/features/products/products.contracts";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-router")>()),
	useRouter: () => ({
		state: { location: { state: {} } },
		history: { canGoBack: () => false },
	}),
	Link: ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	),
}));
const readProduct = vi.hoisted(() => vi.fn());
vi.mock("@/features/products/data/products-http-client", () => ({
	getProductById: readProduct,
	getProducts: vi.fn(),
	getProductsPage: vi.fn(),
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
function renderPreview(element: React.ReactNode) {
	const client = new QueryClient();
	client.setQueryData(productByIdQueryOptions(product.id).queryKey, product);
	return render(
		<QueryClientProvider client={client}>{element}</QueryClientProvider>,
	);
}
beforeEach(() => {
	vi.stubGlobal("scrollTo", vi.fn());
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
afterEach(async () => {
	cleanup();
	await new Promise(requestAnimationFrame);
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	document.body.style.overflow = "";
	document.documentElement.style.overflow = "";
});
describe("product preview", () => {
	it("labels the modal and restores page scrolling when dismissed", () => {
		document.body.style.overflow = "auto";
		document.documentElement.style.overflow = "auto";
		const close = vi.fn();
		const view = renderPreview(
			<ProductPreview
				id={product.id}
				product={product}
				filters={{}}
				onClose={close}
			/>,
		);
		expect(screen.getByRole("dialog", { name: "Rice ball" })).toBeTruthy();
		expect(document.documentElement.style.overflow).toBe("hidden");
		expect(document.body.style.overflow).toBe("auto");
		fireEvent.click(
			screen.getByRole("button", { name: "product.details.close" }),
		);
		expect(close).toHaveBeenCalledOnce();
		view.unmount();
		expect(document.body.style.overflow).toBe("auto");
		expect(document.documentElement.style.overflow).toBe("auto");
	});
	it("shows a useful fallback when a product photograph fails", () => {
		renderPreview(
			<ProductPreview
				id={product.id}
				product={product}
				filters={{}}
				onClose={() => {}}
			/>,
		);
		fireEvent.error(screen.getByRole("img", { name: "Rice ball" }));
		expect(screen.getByText("product.noImage")).toBeTruthy();
	});
	it("closes only when the pointer starts and ends outside the modal", () => {
		const close = vi.fn();
		renderPreview(
			<ProductPreview
				id={product.id}
				product={product}
				filters={{}}
				onClose={close}
			/>,
		);
		const dialog = screen.getByRole("dialog");
		const content = screen.getByRole("heading", { name: "Rice ball" });
		fireEvent(
			content,
			new MouseEvent("pointerdown", {
				bubbles: true,
				clientX: 10,
				clientY: 10,
			}),
		);
		fireEvent(
			dialog,
			new MouseEvent("pointerup", { bubbles: true, clientX: -1, clientY: -1 }),
		);
		expect(close).not.toHaveBeenCalled();
		fireEvent(
			dialog,
			new MouseEvent("pointerdown", {
				bubbles: true,
				clientX: -1,
				clientY: -1,
			}),
		);
		fireEvent(
			dialog,
			new MouseEvent("pointerup", { bubbles: true, clientX: -1, clientY: -1 }),
		);
		expect(close).toHaveBeenCalledOnce();
	});
});

it.each([false, true])(
	"announces detail loading with decorative skeletons hidden (modal=%s)",
	(modal) => {
		const view = render(<ProductDetailPending modal={modal} />);
		expect(screen.getByRole("status").textContent).toBe(
			"product.details.loading",
		);
		expect(view.container.querySelector('[aria-hidden="true"]')).toBeTruthy();
	},
);
it("retries the failed product in place, handles another failure, and then recovers", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	readProduct
		.mockReset()
		.mockRejectedValueOnce(new Error("offline"))
		.mockRejectedValueOnce(new Error("still offline"));
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	render(
		<QueryClientProvider client={client}>
			<ProductPreview
				id={product.id}
				product={product}
				filters={{ stores: [product.store] }}
				onClose={() => {}}
			/>
		</QueryClientProvider>,
	);
	try {
		await screen.findByRole("heading", {
			name: "product.details.notFoundTitle",
		});
		fireEvent.click(screen.getByRole("button", { name: "product.retry" }));
		await waitFor(() => expect(readProduct).toHaveBeenCalledTimes(2));
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "product.retry" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
		expect(
			screen.getByRole("heading", { name: "product.details.notFoundTitle" }),
		).toBeTruthy();
		let release: (value: PublicProduct) => void = () => {};
		readProduct.mockImplementationOnce(
			() =>
				new Promise<PublicProduct>((resolve) => {
					release = resolve;
				}),
		);
		fireEvent.click(screen.getByRole("button", { name: "product.retry" }));
		expect(screen.getByRole("status").textContent).toBe(
			"product.details.loading",
		);
		expect(
			screen
				.getByRole("button", { name: "product.retry" })
				.hasAttribute("disabled"),
		).toBe(true);
		await waitFor(() => expect(readProduct).toHaveBeenCalledTimes(3));
		release(product);
		await screen.findByRole("heading", { name: "Rice ball" });
		expect(screen.queryByRole("button", { name: "product.retry" })).toBeNull();
		expect(document.activeElement).toBe(
			screen.getByRole("button", { name: "product.details.close" }),
		);
	} finally {
		client.clear();
	}
});
