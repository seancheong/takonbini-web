import type { PublicProduct } from "@/@types/product";
import { makeCatalogPrototypeFixtures } from "@/features/product/fixtures/catalogPrototypeFixtures";

export type PrototypeStore = "All" | "SevenEleven" | "Lawson" | "FamilyMart";

export const prototypeProducts = makeCatalogPrototypeFixtures()
	.filter(({ observation }) => observation.freshness === "active")
	.map(({ product }) => product);

export const storeNames: Record<PrototypeStore, string> = {
	All: "All stores",
	SevenEleven: "7-Eleven",
	Lawson: "Lawson",
	FamilyMart: "FamilyMart",
};

export const storeShortNames: Record<Exclude<PrototypeStore, "All">, string> = {
	SevenEleven: "7i",
	Lawson: "L",
	FamilyMart: "FM",
};

export function productTitle(product: PublicProduct) {
	return product.title.en ?? product.title.ja;
}

export function productPrice(product: PublicProduct) {
	return product.price ? `¥${product.price}` : "Price pending";
}

export function filterProducts(
	products: readonly PublicProduct[],
	query: string,
	store: PrototypeStore,
) {
	const needle = query.trim().toLocaleLowerCase();
	return products.filter((product) => {
		const matchesStore = store === "All" || product.store === store;
		const searchable = [product.title.en, product.title.ja, product.category]
			.filter(Boolean)
			.join(" ")
			.toLocaleLowerCase();
		return matchesStore && (!needle || searchable.includes(needle));
	});
}
