import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/image")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: async ({ request }) => {
					const { serveProductImage } = await import(
						"@/server/product-image.server"
					);
					return serveProductImage(request);
				},
			}),
	},
	component: () => null,
});
