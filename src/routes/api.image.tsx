import { createFileRoute } from "@tanstack/react-router";

const userAgent = "TakonbiniImageProxy/1.0";

export const Route = createFileRoute("/api/image")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: async ({ request }) => {
					const requestUrl = new URL(request.url);
					const target = requestUrl.searchParams.get("url");

					if (!target) {
						return new Response("Missing url parameter", { status: 400 });
					}

					let targetUrl: URL;
					try {
						targetUrl = new URL(target);
					} catch {
						return new Response("Invalid url parameter", { status: 400 });
					}

					if (!["http:", "https:"].includes(targetUrl.protocol)) {
						return new Response("Unsupported protocol", { status: 400 });
					}

					const upstream = await fetch(targetUrl.toString(), {
						headers: {
							"user-agent": userAgent,
						},
					});

					const headers = new Headers();
					const contentType = upstream.headers.get("content-type");

					if (contentType) {
						headers.set("content-type", contentType);
					}

					headers.set(
						"cache-control",
						"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
					); // 1 day browser, 7 days edge

					const etag = upstream.headers.get("etag");
					if (etag) {
						headers.set("etag", etag);
					}

					const lastModified = upstream.headers.get("last-modified");
					if (lastModified) {
						headers.set("last-modified", lastModified);
					}

					return new Response(upstream.body, {
						status: upstream.status,
						headers,
					});
				},
			}),
	},
	component: () => null,
});
