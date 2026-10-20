import { expect, it, vi } from "vitest";

const source = vi.hoisted(() => ({
	initialized: false,
	serve: vi.fn(
		async () =>
			new Response("fixture", { headers: { "content-type": "image/webp" } }),
	),
}));
vi.mock("@/server/product-image.server", () => {
	source.initialized = true;
	return { serveProductImage: source.serve };
});

import imageHandler from "@/server/product-image-handler";

it("does not initialize the native image handler with the route tree, but delegates image requests", async () => {
	expect(source.initialized).toBe(false);
	const rejected = await imageHandler.fetch(
		new Request("https://web.example.test/api/image", { method: "POST" }),
	);
	expect(rejected.status).toBe(405);
	expect(source.initialized).toBe(false);
	const request = new Request("https://web.example.test/api/image?url=fixture");
	const response = await imageHandler.fetch(request);
	expect(source.initialized).toBe(true);
	expect(source.serve).toHaveBeenCalledExactlyOnceWith(request);
	expect(await response.text()).toBe("fixture");
});
