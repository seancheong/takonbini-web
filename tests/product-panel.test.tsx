// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { useEffect, useRef, useState } from "react";
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
import { Store } from "@/features/products/products.contracts";

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
	location: { pathname: "/", state: {} as { productModalId?: string } },
	resolvedLocation: { pathname: "/" },
}));
vi.mock("@tanstack/react-router", () => ({
	useRouter: () => ({ navigate: vi.fn(), history: { back: vi.fn() } }),
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
				<a
					key={product.id}
					href={`/products/${product.id}`}
					data-product-id={product.id}
				>
					{product.id}
				</a>
			))}
		</div>
	),
}));

vi.mock("@/features/products/catalog/ProductPreview", () => ({
	default: () => {
		const close = useRef<HTMLButtonElement>(null);
		useEffect(() => close.current?.focus(), []);
		return (
			<div role="dialog">
				<button ref={close} type="button">
					Close preview
				</button>
			</div>
		);
	},
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
	routerState.location.state = {};
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

	it("immediately selects the requested store and overlays existing results until navigation completes", async () => {
		query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
		let finish = () => {};
		function Catalog() {
			const [filters, setFilters] = useState({ stores: [Store.LAWSON] });
			return (
				<CatalogScreen
					filters={filters}
					onApply={(next) =>
						new Promise<void>((resolve) => {
							finish = () => {
								setFilters({ stores: next.stores ?? [] });
								resolve();
							};
						})
					}
				/>
			);
		}
		render(<Catalog />);
		fireEvent.click(
			screen.getByRole("button", { name: "product.store.familyMart" }),
		);
		expect(
			screen
				.getByRole("button", { name: "product.store.familyMart" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(
			screen
				.getByRole("button", { name: "product.store.lawson" })
				.getAttribute("aria-pressed"),
		).toBe("false");
		expect(
			screen.getByRole("status", { name: "product.loading" }),
		).toBeTruthy();
		expect(screen.getByText("loaded-product").closest("[inert]")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "product.filters.searchLabel" }),
		).toBeTruthy();
		await act(async () => finish());
		await waitFor(() =>
			expect(
				screen.queryByRole("status", { name: "product.loading" }),
			).toBeNull(),
		);
		expect(
			screen
				.getByRole("button", { name: "product.store.familyMart" })
				.getAttribute("aria-pressed"),
		).toBe("true");
	});

	it("keeps the latest store choice during overlapping navigation and rolls back canceled changes", async () => {
		query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
		const complete: (() => void)[] = [];
		const apply = vi.fn(
			() => new Promise<void>((resolve) => complete.push(resolve)),
		);
		render(
			<CatalogScreen
				filters={{ stores: [Store.LAWSON], search: "tea" }}
				onApply={apply}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "product.store.familyMart" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "product.store.sevenEleven" }),
		);
		expect(
			screen
				.getByRole("button", { name: "product.store.sevenEleven" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(apply).toHaveBeenLastCalledWith({
			stores: [Store.SEVEN_ELEVEN],
			search: "tea",
		});
		await act(async () => {
			for (const resolve of complete) resolve();
		});
		await waitFor(() =>
			expect(
				screen.queryByRole("status", { name: "product.loading" }),
			).toBeNull(),
		);
		expect(
			screen
				.getByRole("button", { name: "product.store.lawson" })
				.getAttribute("aria-pressed"),
		).toBe("true");
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

describe("catalog history focus", () => {
	function catalog() {
		return <CatalogScreen filters={{ search: "tea" }} onApply={vi.fn()} />;
	}
	function openPreview(view: ReturnType<typeof render>) {
		routerState.location.state = { productModalId: "loaded-product" };
		view.rerender(catalog());
		expect(document.activeElement).toBe(
			screen.getByRole("button", { name: "Close preview" }),
		);
	}
	it("restores the product only after returning navigation makes results interactive", () => {
		query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
		const view = render(catalog());
		const product = screen.getByRole("link", { name: "loaded-product" });
		product.focus();
		openPreview(view);
		routerState.location.state = {};
		routerState.isLoading = true;
		view.rerender(catalog());
		expect(product.closest("[inert]")).toBeTruthy();
		expect(document.activeElement).toBe(document.body);
		routerState.isLoading = false;
		view.rerender(catalog());
		expect(product.closest("[inert]")).toBeNull();
		expect(document.activeElement).toBe(product);
	});
	it("restores a history-reopened product even when its card was not focused on opening", () => {
		query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
		const view = render(catalog());
		screen.getByRole("searchbox").focus();
		openPreview(view);
		routerState.location.state = {};
		view.rerender(catalog());
		expect(document.activeElement).toBe(
			screen.getByRole("link", { name: "loaded-product" }),
		);
	});
	it("falls back to the catalog heading if the originating product is no longer present", () => {
		query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
		const view = render(catalog());
		openPreview(view);
		routerState.location.state = {};
		query.data = { pages: [{ products: [] }] };
		view.rerender(catalog());
		expect(document.activeElement).toBe(
			screen.getByRole("heading", { name: "product.title" }),
		);
	});
	it("does not steal focus chosen while the catalog is still refreshing", () => {
		query.data = { pages: [{ products: [{ id: "loaded-product" }] }] };
		const view = render(catalog());
		openPreview(view);
		routerState.location.state = {};
		query.isFetching = true;
		view.rerender(catalog());
		const search = screen.getByRole("searchbox");
		search.focus();
		query.isFetching = false;
		view.rerender(catalog());
		expect(document.activeElement).toBe(search);
	});
});
