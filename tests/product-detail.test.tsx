// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
	ProductDetailScreen,
	productQueries,
} from "@/features/products/products";
import type { ProductFilters } from "@/features/products/products.contracts";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";

vi.mock("@tanstack/react-router", async () => {
	const React = await import("react");
	return {
		useRouter: () => ({
			state: { location: { state: {} } },
			history: { canGoBack: () => false },
		}),
		Link: ({
			search,
			children,
			...props
		}: {
			search: ProductFilters;
			children: React.ReactNode;
		}) =>
			React.createElement(
				"a",
				{
					...props,
					href: `/?${new URLSearchParams({
						stores: JSON.stringify(search.stores ?? []),
					})}`,
				},
				children,
			),
	};
});
vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

function detail() {
	const product = catalogProduct({ releaseDate: null });
	const client = new QueryClient();
	client.setQueryData(productQueries.detail(product.id).queryKey, product);
	return {
		client,
		tree: (
			<QueryClientProvider client={client}>
				<ProductDetailScreen
					id={product.id}
					filters={{ stores: [product.store] }}
				/>
			</QueryClientProvider>
		),
	};
}

describe("public product detail screen", () => {
	it("labels a missing description translation without changing a translated title", () => {
		const product = catalogProduct({
			title: { ja: "題名", en: "Translated title" },
			description: { ja: "日本語の説明", en: " " },
		});
		const client = new QueryClient();
		client.setQueryData(productQueries.detail(product.id).queryKey, product);
		try {
			const html = renderToString(
				<QueryClientProvider client={client}>
					<ProductDetailScreen id={product.id} filters={{}} />
				</QueryClientProvider>,
			);
			expect(html).toContain('lang="en"');
			expect(html).toContain("Translated title");
			expect(html).toContain('lang="ja"');
			expect(html.match(/product.fallbackLanguage/g)).toHaveLength(1);
		} finally {
			client.clear();
		}
	});
	it("renders cached product content and the filtered catalog return link on the server", () => {
		const { client, tree } = detail();
		try {
			const html = renderToString(tree);
			expect(html).toContain("Matcha");
			expect(html).toContain("Tea dessert");
			expect(html).toContain("/?stores=%5B%22Lawson%22%5D");
			expect(html).not.toContain("product.details.releaseDate");
		} finally {
			client.clear();
		}
	});

	it("keeps detail loading feedback and its unavailable-image fallback", () => {
		const product = catalogProduct({
			images: ["https://www.family.co.jp/p.jpg"],
		});
		const client = new QueryClient();
		client.setQueryData(productQueries.detail(product.id).queryKey, product);
		const view = render(
			<QueryClientProvider client={client}>
				<ProductDetailScreen id={product.id} filters={{}} />
			</QueryClientProvider>,
		);
		try {
			const image = view.getByRole("img", { name: "Matcha" });
			expect(view.getByText("product.imageLoading")).toBeTruthy();
			fireEvent.load(image);
			expect(view.queryByText("product.imageLoading")).toBeNull();
			fireEvent.error(image);
			expect(view.queryByRole("img", { name: "Matcha" })).toBeNull();
			expect(view.getByText("product.noImage")).toBeTruthy();
			expect(view.getByText("product.unavailable")).toBeTruthy();
		} finally {
			view.unmount();
			client.clear();
		}
	});

	it("hydrates its server markup without a recoverable mismatch", async () => {
		const { client, tree } = detail();
		const container = document.createElement("div");
		container.innerHTML = renderToString(tree);
		document.body.append(container);
		const errors: unknown[] = [];
		let root: ReturnType<typeof hydrateRoot>;
		await act(async () => {
			root = hydrateRoot(container, tree, {
				onRecoverableError: (error) => errors.push(error),
			});
		});
		expect(errors).toEqual([]);
		await act(async () => root.unmount());
		client.clear();
		container.remove();
	});
});
