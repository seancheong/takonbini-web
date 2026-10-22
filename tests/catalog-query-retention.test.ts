import { QueryClient } from "@tanstack/react-query";
import { expect, it } from "vitest";
import { retainLatestProductDetail } from "@/features/products/data/catalog-query-retention";

it("bounds detail browsing while leaving active detail and unrelated queries intact", () => {
	const client = new QueryClient();
	const stop = retainLatestProductDetail(client);
	client.setQueryData(["unrelated"], "keep");
	for (let i = 0; i < 100; i++)
		client.setQueryData(["products", "byId", i], { id: i });
	expect(
		client.getQueryCache().findAll({ queryKey: ["products", "byId"] }),
	).toHaveLength(1);
	expect(client.getQueryData(["products", "byId", 99])).toEqual({ id: 99 });
	expect(client.getQueryData(["unrelated"])).toBe("keep");
	stop();
	client.clear();
});
