import { createMiddleware, createStart } from "@tanstack/react-start";

const timing = createMiddleware().server(async ({ next, pathname }) => {
	if (pathname !== "/") return next();
	const { catalogTiming } = await import("./server/catalog-timing.server");
	const started = performance.now();
	return catalogTiming.run({ sourceMs: 0 }, async () => {
		const result = await next();
		result.response.headers.append(
			"Server-Timing",
			`app;dur=${(performance.now() - started).toFixed(1)}, catalog-source;dur=${catalogTiming.getStore()?.sourceMs.toFixed(1)}`,
		);
		return result;
	});
});

export const startInstance = createStart(() => ({
	requestMiddleware: [timing],
}));
