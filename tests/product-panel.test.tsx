// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { CatalogScreen } from "@/features/products/products";

const query = vi.hoisted(() => ({
	data: undefined as undefined | { pages: { products: { id: string }[] }[] },
	isLoading: false,
	hasNextPage: false,
	isFetchingNextPage: false,
	isFetching: false,
	isError: false,
	isFetchNextPageError: false,
	fetchNextPage: vi.fn(),
	refetch: vi.fn(),
}));
vi.mock("@tanstack/react-query", () => ({ useInfiniteQuery: () => query }));
const routerState = vi.hoisted(() => ({
	isLoading: false,
	location: { pathname: "/" },
	resolvedLocation: { pathname: "/" },
}));
vi.mock("@tanstack/react-router", () => ({
	useRouterState: ({
		select,
	}: {
		select: (state: typeof routerState) => boolean;
	}) => select(routerState),
}));
vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/features/products/catalog/ProductGrid", () => ({
	default: ({ products }: { products: { id: string }[] }) => (
		<div>
			{products.map((product) => (
				<span key={product.id}>{product.id}</span>
			))}
		</div>
	),
}));

beforeAll(() => {
	HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close = function () {
		this.removeAttribute("open");
	};
});
beforeEach(() => {
	Object.assign(query, {
		data: undefined,
		isLoading: false,
		hasNextPage: false,
		isFetchingNextPage: false,
		isFetching: false,
		isError: false,
		isFetchNextPageError: false,
	});
	routerState.isLoading = false;
	routerState.location.pathname = "/";
	routerState.resolvedLocation.pathname = "/";
	vi.clearAllMocks();
});
afterEach(cleanup);

describe("catalog states", () => {
	it.each([
		["leaving", "/products/product-1", "/"],
		["returning", "/", "/products/product-1"],
	])(
		"does not insert a catalog refresh row when %s between catalog and detail",
		(_direction, next, previous) => {
			query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
			routerState.isLoading = true;
			routerState.location.pathname = next;
			routerState.resolvedLocation.pathname = previous;
			render(<CatalogScreen filters={{}} onApply={vi.fn()} />);
			expect(screen.queryByText("product.loading")).toBeNull();
		},
	);

	it("announces a pending filter change within the catalog", () => {
		query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
		routerState.isLoading = true;
		render(<CatalogScreen filters={{}} onApply={vi.fn()} />);
		expect(screen.getByText("product.loading")).toBeTruthy();
	});

	it("shows a retryable service failure instead of an empty catalog", () => {
		query.isError = true;
		render(<CatalogScreen filters={{}} onApply={vi.fn()} />);
		expect(screen.getByRole("alert").textContent).toContain("product.error");
		expect(screen.queryByText("product.empty")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "product.retry" }));
		expect(query.refetch).toHaveBeenCalledOnce();
	});

	it("distinguishes no matches from an empty catalog and clears filters", () => {
		const apply = vi.fn();
		render(
			<CatalogScreen filters={{ search: "tea", limit: 20 }} onApply={apply} />,
		);
		expect(screen.getByText("product.noMatches")).toBeTruthy();
		fireEvent.click(
			screen.getAllByRole("button", { name: "product.clearFilters" })[1],
		);
		expect(apply).toHaveBeenCalledWith({ limit: 20 });
	});

	it("keeps loaded products visible and retries a failed next page", () => {
		query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
		query.isError = true;
		query.isFetchNextPageError = true;
		query.hasNextPage = true;
		render(<CatalogScreen filters={{}} onApply={vi.fn()} />);
		expect(screen.getByText("loaded-product")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "product.retry" }));
		expect(query.fetchNextPage).toHaveBeenCalledOnce();
		expect(query.refetch).not.toHaveBeenCalled();
	});

	it("discards canceled draft filters when the dialog is reopened", () => {
		const apply = vi.fn();
		render(<CatalogScreen filters={{}} onApply={apply} />);
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.title" }),
		);
		fireEvent.click(
			screen.getByRole("checkbox", { name: "product.category.sweets" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.hide" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "product.filters.title" }),
		);
		expect(
			(
				screen.getByRole("checkbox", {
					name: "product.category.sweets",
				}) as HTMLInputElement
			).checked,
		).toBe(false);
		expect(apply).not.toHaveBeenCalled();
	});
});
