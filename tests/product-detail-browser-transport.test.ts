// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { ProductNotFoundError } from "@/features/products/data/product-errors";
import { getProductById } from "@/features/products/data/products-http-client";

vi.mock("@tanstack/react-start", () => ({
	createIsomorphicFn: () => ({
		server: () => ({ client: (implementation: unknown) => implementation }),
	}),
}));
afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

it("preserves a browser API 404 as product absence", async () => {
	const read = vi
		.fn()
		.mockResolvedValue(
			Response.json({ error: "Product not found" }, { status: 404 }),
		);
	vi.stubGlobal("fetch", read);
	await expect(getProductById("missing")).rejects.toBeInstanceOf(
		ProductNotFoundError,
	);
	expect(read).toHaveBeenCalledOnce();
});

it("keeps upstream server and transport failures distinct from absence", async () => {
	vi.spyOn(console, "error").mockImplementation(() => {});
	const read = vi
		.fn()
		.mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
		.mockRejectedValueOnce(new TypeError("offline"));
	vi.stubGlobal("fetch", read);
	await expect(getProductById("unavailable")).rejects.toThrow(
		"Failed to fetch product.",
	);
	await expect(getProductById("offline")).rejects.toBeInstanceOf(TypeError);
	expect(read).toHaveBeenCalledTimes(2);
});
