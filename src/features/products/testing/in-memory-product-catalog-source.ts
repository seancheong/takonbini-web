import {
	type ActiveCatalogProduct,
	activeCatalogProductSchema,
} from "../products.contracts";
import type { ProductCatalogSource } from "../server/product-catalog-source";

export function createInMemoryProductCatalogSource(
	input: readonly ActiveCatalogProduct[],
	now = new Date(),
): ProductCatalogSource {
	const products = input.map((product) =>
		activeCatalogProductSchema.parse(product),
	);
	return {
		async list(parameters) {
			const search = parameters.get("search")?.toLocaleLowerCase();
			const status = parameters.get("status") ?? "allWithoutSoon";
			const matches = products.filter((product) => {
				const upcoming = Boolean(
					product.releaseDate && new Date(product.releaseDate) > now,
				);
				if (
					(status === "allWithoutSoon" && upcoming) ||
					(status === "soon" && !upcoming) ||
					(status === "new" && !product.isNew)
				)
					return false;
				for (const field of ["stores", "categories", "regions"] as const) {
					const selected = parameters.get(field)?.split(",");
					const values =
						field === "stores"
							? [product.store]
							: field === "categories"
								? [product.category]
								: (product.regions ?? []);
					if (
						selected?.length &&
						!values.some((value) => value && selected.includes(value))
					)
						return false;
				}
				const minimum = parameters.get("minPrice"),
					maximum = parameters.get("maxPrice");
				if (
					(minimum !== null && product.price < Number(minimum)) ||
					(maximum !== null && product.price > Number(maximum))
				)
					return false;
				return (
					!search ||
					[
						...Object.values(product.title),
						...Object.values(product.description),
					].some((text) => text?.toLocaleLowerCase().includes(search))
				);
			});
			const offset = Number(parameters.get("cursor") ?? "0"),
				limit = Number(parameters.get("limit") ?? "20");
			if (
				!Number.isInteger(offset) ||
				offset < 0 ||
				!Number.isInteger(limit) ||
				limit < 1
			)
				return {
					ok: false,
					kind: "unavailable",
					origin: "http",
					status: 400,
					headers: new Headers(),
					body: "Invalid catalog parameters",
				};
			const page = matches.slice(offset, offset + limit);
			return {
				ok: true,
				value: {
					products: page,
					...(offset + limit < matches.length
						? { nextCursor: String(offset + limit) }
						: {}),
				},
				status: 200,
				headers: new Headers(),
			};
		},
		async find(id) {
			const product = products.find((product) => product.id === id);
			return product
				? { ok: true, value: product, status: 200, headers: new Headers() }
				: {
						ok: false,
						kind: "not-found",
						origin: "http",
						status: 404,
						headers: new Headers(),
						body: "Product not found",
					};
		},
		async listIndexableIds() {
			return {
				ok: true,
				value: { ids: products.map((product) => product.id), complete: true },
				status: 200,
				headers: new Headers(),
			};
		},
	};
}
