export enum Store {
	SEVEN_ELEVEN = "SevenEleven",
	LAWSON = "Lawson",
	FAMILY_MART = "FamilyMart",
}

export const REGIONS = [
	"Hokkaido",
	"Tohoku",
	"Kanto",
	"Tokai",
	"Hokuriku",
	"Kansai",
	"ChugokuShikoku",
	"Kyushu",
	"Okinawa",
] as const;

export type Region = (typeof REGIONS)[number];

export const JAPANESE_REGION_MAP: Record<string, Region> = {
	北海道: "Hokkaido",
	東北: "Tohoku",
	関東: "Kanto",
	東海: "Tokai",
	北陸: "Hokuriku",
	関西: "Kansai",
	"中国・四国": "ChugokuShikoku",
	中国: "ChugokuShikoku",
	四国: "ChugokuShikoku",
	九州: "Kyushu",
	沖縄: "Okinawa",
	宮崎: "Kyushu",
	鹿児島: "Kyushu",
};

export enum Category {
	ONIGIRI = "Onigiri",
	BENTO = "Bento",
	SUSHI = "Sushi",
	SANDWICH = "Sandwich",
	BREAD = "Bread",
	NOODLE = "Noodle",
	PASTA = "Pasta",
	SALAD = "Salad",
	SIDE_DISH = "SideDish",
	FRIED_FOOD = "FriedFood",
	STEAMED_BUN = "SteamedBun",
	ODEN = "Oden",
	GRATIN = "Gratin",
	TAKOYAKI = "Takoyaki",
	SWEETS = "Sweets",
	ALCOHOL = "Alcohol",
	DRINK = "Drink",
	FROZEN = "Frozen",
	OTHER = "Other",
}

export interface Product {
	id: string;
	title: {
		ja: string;
		en?: string;
		zh?: string;
	};
	price: number;
	description: {
		ja: string;
		en?: string;
		zh?: string;
	};
	isTranslated?: boolean;
	images: string[];
	url: string;
	store: Store;
	releaseDate?: string;
	category?: Category;
	regions?: Region[];
	isNew?: boolean;
	searchKeywords?: string;
	ttl?: number;
}

export type PublicProduct = Omit<
	Product,
	"isTranslated" | "searchKeywords" | "ttl"
>;
