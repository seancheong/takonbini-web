// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicProduct } from "@/@types/product";
import ProductCard from "@/features/product/components/ProductCard";

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

const product: PublicProduct = {
	id: "product-1",
	title: { ja: "抹茶", en: "Matcha" },
	price: 180,
	description: { ja: "説明" },
	images: [],
	url: "https://store.example.test/product-1",
	store: "Lawson" as PublicProduct["store"],
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
