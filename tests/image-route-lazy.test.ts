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

import { Route } from "@/routes/api.image";

it("does not initialize the native image handler with the route tree, but delegates image requests", async () => {
	expect(source.initialized).toBe(false);
	const route = Route as unknown as {
		options: {
			server: {
				handlers: (input: { createHandlers: <T>(value: T) => T }) => {
					GET: (input: { request: Request }) => Promise<Response>;
				};
			};
		};
	};
	const configured = route.options.server.handlers({
		createHandlers: <T>(value: T) => value,
	});
	const request = new Request("https://web.example.test/api/image?url=fixture");
	const response = await configured.GET({ request });
	expect(source.initialized).toBe(true);
	expect(source.serve).toHaveBeenCalledExactlyOnceWith(request);
	expect(await response.text()).toBe("fixture");
});
