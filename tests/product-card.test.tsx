// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductCard from "@/features/products/catalog/ProductCard";
import type { ActiveCatalogProduct } from "@/features/products/products.contracts";

const routerMocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	go: vi.fn(),
	subscribe: vi.fn(() => () => {}),
}));

vi.mock("@tanstack/react-router", async () => {
	const React = await import("react");
	return {
		Link: ({
			to,
			params,
			children,
			onClick,
			...props
		}: {
			to: string;
			params: { id: string };
			children: React.ReactNode;
			onClick?: React.MouseEventHandler<HTMLAnchorElement>;
		} & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
			React.createElement(
				"a",
				{
					...props,
					href: to.replace("$id", params.id),
					onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
						event.preventDefault();
						onClick?.(event);
					},
				},
				children,
			),
		useNavigate: () => routerMocks.navigate,
		useRouter: () => ({
			subscribe: routerMocks.subscribe,
			history: { go: routerMocks.go },
		}),
	};
});

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));

const product: ActiveCatalogProduct = {
	id: "product-1",
	title: { ja: "抹茶", en: "Matcha" },
	price: 180,
	description: { ja: "説明" },
	images: [],
	url: "https://store.example.test/product-1",
	store: "Lawson" as ActiveCatalogProduct["store"],
};

afterEach(() => {
	vi.clearAllMocks();
	document.body.innerHTML = "";
});

describe("product card rendering and navigation", () => {
	it("renders a detail link and navigates to the selected product", () => {
		render(<ProductCard product={product} />);
		const link = screen.getByRole("link", { name: "Matcha" });
		expect(link.getAttribute("href")).toBe("/products/product-1");

		fireEvent.click(link);
		expect(routerMocks.navigate).toHaveBeenCalledWith({
			to: "/products/$id",
			params: { id: "product-1" },
		});
	});

	it("carries catalog filters into product detail navigation", () => {
		const filters = { search: "matcha", minPrice: 100 };
		render(<ProductCard product={product} filters={filters} />);
		fireEvent.click(screen.getByRole("link", { name: "Matcha" }));
		expect(routerMocks.navigate).toHaveBeenCalledWith({
			to: "/products/$id",
			params: { id: "product-1" },
			search: filters,
		});
	});

	it("keeps ordinary browser modifier clicks out of programmatic navigation", () => {
		render(<ProductCard product={product} />);
		fireEvent.click(screen.getByRole("link", { name: "Matcha" }), {
			ctrlKey: true,
		});
		expect(routerMocks.navigate).not.toHaveBeenCalled();
	});

	it("uses the existing field fallback and unknown price presentation", () => {
		render(
			<ProductCard product={{ ...product, title: { ja: "抹茶" }, price: 0 }} />,
		);
		expect(screen.getByRole("link", { name: "抹茶" })).toBeTruthy();
		expect(screen.getByText("product.priceUnknown")).toBeTruthy();
		expect(screen.getByText("product.noImage")).toBeTruthy();
	});

	it("hydrates server-rendered card markup without a recoverable mismatch", async () => {
		const html = renderToString(<ProductCard product={product} />);
		const container = document.createElement("div");
		container.innerHTML = html;
		document.body.append(container);
		const recoverableErrors: unknown[] = [];
		let root: ReturnType<typeof hydrateRoot>;

		await act(async () => {
			root = hydrateRoot(container, <ProductCard product={product} />, {
				onRecoverableError: (error) => recoverableErrors.push(error),
			});
		});

		expect(recoverableErrors).toEqual([]);
		await act(async () => root.unmount());
	});
});
