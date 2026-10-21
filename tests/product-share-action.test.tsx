// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ProductShareAction from "@/features/products/detail/ProductShareAction";
import { getProductShareUrl } from "@/features/products/model/product-sharing";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});
function choose(name: string) {
	fireEvent.click(
		screen.getByRole("button", { name: "product.details.share" }),
	);
	fireEvent.click(screen.getByRole("button", { name }));
}
function apis(
	share?: ReturnType<typeof vi.fn>,
	copy = vi.fn().mockResolvedValue(undefined),
) {
	vi.stubGlobal("navigator", { share, clipboard: { writeText: copy } });
	return copy;
}
it.each(["en", "ja", "zh"] as const)(
	"builds a clean %s URL without browser search/filter/pagination state",
	(language) => {
		const url = getProductShareUrl(
			"https://takonbini.com/products/old?limit=20&search=マンゴー烏龍&stores=Lawson",
			"5784c6a1e230b3760a421b4b65ddab80",
			language,
		);
		expect(url).toBe(
			`https://takonbini.com/products/5784c6a1e230b3760a421b4b65ddab80?lang=${language}`,
		);
	},
);
it("encodes an opaque product identifier as one path segment", () => {
	expect(getProductShareUrl("https://web.test", "one/two &三", "zh")).toBe(
		"https://web.test/products/one%2Ftwo%20%26%E4%B8%89?lang=zh",
	);
});
it("opens native sharing with only a localized title and clean language URL", async () => {
	const share = vi.fn().mockResolvedValue(undefined);
	const copy = apis(share);
	render(
		<ProductShareAction productId="one" language="zh" title="芒果烏龍茶" />,
	);
	choose("product.details.moreApps");
	await waitFor(() =>
		expect(share).toHaveBeenCalledExactlyOnceWith({
			title: "芒果烏龍茶",
			url: `${location.origin}/products/one?lang=zh`,
		}),
	);
	expect(copy).not.toHaveBeenCalled();
});
it("copies a clean link and announces success when native sharing is unavailable", async () => {
	const copy = apis();
	render(<ProductShareAction productId="one" language="ja" title="商品" />);
	choose("product.details.copyLink");
	await waitFor(() =>
		expect(copy).toHaveBeenCalledExactlyOnceWith(
			`${location.origin}/products/one?lang=ja`,
		),
	);
	expect(await screen.findByText("product.details.linkCopied")).toBeTruthy();
});
it("does not copy or report an error when native sharing is cancelled", async () => {
	const copy = apis(
		vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError")),
	);
	render(<ProductShareAction productId="one" language="en" title="Product" />);
	choose("product.details.moreApps");
	await waitFor(() =>
		expect(
			screen
				.getByRole("button", { name: "product.details.moreApps" })
				.hasAttribute("disabled"),
		).toBe(false),
	);
	expect(copy).not.toHaveBeenCalled();
	expect(screen.queryByText("product.details.shareCopyError")).toBeNull();
});
it("falls back to copying after a native share failure", async () => {
	const copy = apis(vi.fn().mockRejectedValue(new Error("Unavailable")));
	render(<ProductShareAction productId="one" language="en" title="Product" />);
	choose("product.details.moreApps");
	expect(await screen.findByText("product.details.linkCopied")).toBeTruthy();
	expect(copy).toHaveBeenCalledExactlyOnceWith(
		`${location.origin}/products/one?lang=en`,
	);
});
it("offers a labelled manual-copy field when clipboard access is denied", async () => {
	apis(undefined, vi.fn().mockRejectedValue(new Error("Denied")));
	render(<ProductShareAction productId="one" language="zh" title="商品" />);
	choose("product.details.copyLink");
	const input = await screen.findByRole("textbox", {
		name: "product.details.shareLink",
	});
	expect(input.getAttribute("value")).toBe(
		`${location.origin}/products/one?lang=zh`,
	);
	expect(input.hasAttribute("readonly")).toBe(true);
	expect(screen.getByText("product.details.shareCopyError")).toBeTruthy();
});
it("disables the action while native sharing is pending", async () => {
	let finish: () => void = () => {};
	const pending = new Promise<void>((resolve) => {
		finish = resolve;
	});
	const share = vi.fn(() => pending);
	apis(share);
	render(<ProductShareAction productId="one" language="en" title="Product" />);
	fireEvent.click(
		screen.getByRole("button", { name: "product.details.share" }),
	);
	const button = screen.getByRole("button", {
		name: "product.details.moreApps",
	});
	fireEvent.click(button);
	expect(button.hasAttribute("disabled")).toBe(true);
	fireEvent.click(button);
	expect(share).toHaveBeenCalledTimes(1);
	finish();
	await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
});

it("offers encoded Facebook and X composers using the same clean link", () => {
	apis();
	render(
		<ProductShareAction productId="one" language="zh" title="芒果 & 烏龍" />,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "product.details.share" }),
	);
	const facebook = new URL(
		screen.getByRole<HTMLAnchorElement>("link", { name: "Facebook" }).href,
	);
	const x = new URL(
		screen.getByRole<HTMLAnchorElement>("link", { name: "X" }).href,
	);
	expect(facebook.origin).toBe("https://www.facebook.com");
	expect(facebook.searchParams.get("u")).toBe(
		`${location.origin}/products/one?lang=zh`,
	);
	expect(x.origin).toBe("https://twitter.com");
	expect(x.searchParams.get("url")).toBe(
		`${location.origin}/products/one?lang=zh`,
	);
	expect(x.searchParams.get("text")).toBe("芒果 & 烏龍");
	expect(
		screen.queryByRole("button", { name: "product.details.moreApps" }),
	).toBeNull();
});
it("copies for Instagram with clear instructions instead of a fake composer", async () => {
	const copy = apis();
	render(<ProductShareAction productId="one" language="zh" title="商品" />);
	choose("Instagram product.details.copyLink");
	expect(
		await screen.findByText("product.details.instagramCopied"),
	).toBeTruthy();
	expect(copy).toHaveBeenCalledExactlyOnceWith(
		`${location.origin}/products/one?lang=zh`,
	);
});
it("closes sharing on Escape and returns focus to its trigger", () => {
	apis();
	render(<ProductShareAction productId="one" language="en" title="Product" />);
	fireEvent.click(
		screen.getByRole("button", { name: "product.details.share" }),
	);
	fireEvent.keyDown(screen.getByRole("link", { name: "Facebook" }), {
		key: "Escape",
	});
	expect(screen.queryByRole("link", { name: "Facebook" })).toBeNull();
	expect(document.activeElement).toBe(
		screen.getByRole("button", { name: "product.details.share" }),
	);
});
