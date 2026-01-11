export const storeLabelClasses: Record<string, string> = {
	SevenEleven: "text-orange-700 dark:text-orange-400",
	Lawson: "text-blue-700 dark:text-blue-400",
	FamilyMart: "text-emerald-700 dark:text-emerald-400",
};

export const storeLabelKeys = {
	SevenEleven: "product.store.sevenEleven",
	Lawson: "product.store.lawson",
	FamilyMart: "product.store.familyMart",
} as const;

export type StoreLabelKey = (typeof storeLabelKeys)[keyof typeof storeLabelKeys];

export const categoryLabelKeys = {
	Onigiri: "product.category.onigiri",
	Bento: "product.category.bento",
	Sushi: "product.category.sushi",
	Sandwich: "product.category.sandwich",
	Bread: "product.category.bread",
	Noodle: "product.category.noodle",
	Pasta: "product.category.pasta",
	Salad: "product.category.salad",
	SideDish: "product.category.sideDish",
	FriedFood: "product.category.friedFood",
	SteamedBun: "product.category.steamedBun",
	Oden: "product.category.oden",
	Gratin: "product.category.gratin",
	Takoyaki: "product.category.takoyaki",
	Sweets: "product.category.sweets",
	Alcohol: "product.category.alcohol",
	Drink: "product.category.drink",
	Frozen: "product.category.frozen",
	Other: "product.category.other",
} as const;

export type CategoryLabelKey =
	(typeof categoryLabelKeys)[keyof typeof categoryLabelKeys];

export const regionLabelKeys = {
	Hokkaido: "product.region.hokkaido",
	Tohoku: "product.region.tohoku",
	Kanto: "product.region.kanto",
	Tokai: "product.region.tokai",
	Hokuriku: "product.region.hokuriku",
	Kansai: "product.region.kansai",
	ChugokuShikoku: "product.region.chugokuShikoku",
	Kyushu: "product.region.kyushu",
	Okinawa: "product.region.okinawa",
} as const;

export type RegionLabelKey =
	(typeof regionLabelKeys)[keyof typeof regionLabelKeys];
