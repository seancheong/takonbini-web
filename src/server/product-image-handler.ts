import { defineHandler } from "nitro/h3";

export default defineHandler(async (event) => {
	if (event.req.method !== "GET" && event.req.method !== "HEAD") {
		return new Response(null, {
			status: 405,
			headers: { allow: "GET, HEAD", "cache-control": "no-store" },
		});
	}
	const { serveProductImage } = await import("./product-image.server");
	return serveProductImage(event.req);
});
