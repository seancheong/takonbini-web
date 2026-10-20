import { createFileRoute } from "@tanstack/react-router";
import { getProductCatalogSource } from "@/features/products/products.server";

export const Route = createFileRoute("/api/products")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: async ({ request }) => {
					const source = getProductCatalogSource();
					const parameters = new URL(request.url).searchParams;
					const started = performance.now();
					const result = await source.list(parameters);
					const headers = new Headers(result.headers);
					headers.set(
						"Server-Timing",
						`catalog-source;dur=${(performance.now() - started).toFixed(1)}`,
					);
					return new Response(
						result.ok ? JSON.stringify(result.value) : result.body,
						{ status: result.status, headers },
					);
				},
			}),
	},
	component: () => null,
});
