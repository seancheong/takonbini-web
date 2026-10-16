import {
	type ActiveCatalogProduct,
	Category,
	Store,
} from "../products.contracts";

export function catalogProduct(
	overrides: Partial<ActiveCatalogProduct> = {},
): ActiveCatalogProduct {
	return {
		id: "fixture-lawson",
		title: { ja: "抹茶", en: "Matcha", zh: "抹茶" },
		price: 180,
		description: { ja: "説明", en: "Tea dessert", zh: "茶甜點" },
		images: [],
		url: "https://store.example.test/product",
		store: Store.LAWSON,
		category: Category.SWEETS,
		regions: ["Kanto"],
		...overrides,
	};
}

export const catalogFixtures = [
	catalogProduct({ id: "seven", store: Store.SEVEN_ELEVEN, price: 100 }),
	catalogProduct({ id: "lawson", isNew: true }),
	catalogProduct({
		id: "family",
		store: Store.FAMILY_MART,
		price: 300,
		releaseDate: "2099-01-01",
		title: { ja: "パン" },
	}),
];
