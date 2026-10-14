import { createFileRoute } from "@tanstack/react-router";
import { getProductCatalogSource } from "@/features/products/products.server";

export const Route = createFileRoute("/api/products/$id")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: async ({ request, params }) => {
					const source = getProductCatalogSource();
					const parameters = new URL(request.url).searchParams;
					const result = await source.find(params.id, parameters);
					return new Response(
						result.ok ? JSON.stringify(result.value) : result.body,
						{ status: result.status, headers: result.headers },
					);
				},
			}),
	},
	component: () => null,
});
