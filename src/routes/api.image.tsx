import { createFileRoute } from "@tanstack/react-router";
import { serveProductImage } from "@/server/product-image.server";

export const Route = createFileRoute("/api/image")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({ GET: ({ request }) => serveProductImage(request) }),
	},
	component: () => null,
});
