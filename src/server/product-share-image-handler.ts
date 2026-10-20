import { defineHandler } from "nitro/h3";

export default defineHandler(async (event) => {
	const request = event.req;
	if (request.method !== "GET" && request.method !== "HEAD") {
		return new Response(null, {
			status: 405,
			headers: { allow: "GET, HEAD", "cache-control": "no-store" },
		});
	}
	const url = new URL(request.url);
	const fallback = () =>
		new Response(null, {
			status: 302,
			headers: { location: "/share-default.jpg", "cache-control": "no-store" },
		});
	if (
		url.searchParams.getAll("url").length !== 1 ||
		[...url.searchParams.keys()].some((key) => key !== "url")
	)
		return fallback();
	url.pathname = "/api/image";
	url.searchParams.set("w", "1280");
	const { serveProductImage } = await import("./product-image.server");
	const response = await serveProductImage(new Request(url, request), "jpeg");
	if (!response.ok && response.status !== 304) {
		await response.body?.cancel();
		return fallback();
	}
	if (request.method === "HEAD") {
		await response.body?.cancel();
		return new Response(null, {
			status: response.status,
			headers: response.headers,
		});
	}
	return response;
});
