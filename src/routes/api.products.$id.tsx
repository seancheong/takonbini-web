import { createFileRoute } from "@tanstack/react-router";

const buildUpstreamRequest = (request: Request, id: string) => {
	const baseUrl = process.env.PRODUCTS_API_URL;
	const apiKey = process.env.PRODUCTS_API_KEY;

	if (!baseUrl || !apiKey) {
		return {
			error: new Response("Unknown Error", { status: 500 }),
		};
	}

	const requestUrl = new URL(request.url);
	const upstreamUrl = new URL(`${baseUrl}/products/${id}`);
	upstreamUrl.search = requestUrl.search;

	return {
		url: upstreamUrl.toString(),
		headers: { "x-api-key": apiKey },
	};
};

export const Route = createFileRoute("/api/products/$id")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: async ({ params, request }) => {
					const upstream = buildUpstreamRequest(request, params.id);
					if ("error" in upstream) return upstream.error;

					const response = await fetch(upstream.url, {
						headers: upstream.headers,
					});

					return new Response(response.body, {
						status: response.status,
						headers: response.headers,
					});
				},
			}),
	},
	component: () => null,
});
