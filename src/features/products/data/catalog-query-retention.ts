import type { QueryClient } from "@tanstack/react-query";

export function retainLatestProductDetail(client: QueryClient) {
	return client.getQueryCache().subscribe((event) => {
		const key = event.query.queryKey;
		if (key[0] !== "products" || key[1] !== "byId" || event.type === "removed")
			return;
		for (const query of client
			.getQueryCache()
			.findAll({ queryKey: ["products", "byId"] })) {
			if (
				query !== event.query &&
				!query.isActive() &&
				query.state.fetchStatus === "idle"
			)
				client.removeQueries({ queryKey: query.queryKey, exact: true });
		}
	});
}
