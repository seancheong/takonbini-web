import type { PublicProduct } from "@/@types/product";

export type PrototypeLocale = "en" | "ja" | "zh";

export const localeNames: Record<PrototypeLocale, string> = {
	en: "English",
	ja: "日本語",
	zh: "繁體中文",
};

export const localizationCopy = {
	en: {
		brand: "TAKONBINI",
		strapline: "A WEEKLY SHELF INDEX",
		headline: "Small things,\ncarefully indexed.",
		intro:
			"New convenience-store products, observed and arranged with care each week.",
		searchLabel: "Search the index",
		searchPlaceholder: "Search the weekly index",
		filters: "Filters",
		index: "INDEX",
		selectItem: "SELECT AN ITEM TO READ",
		noImage: "Image coming soon",
		pricePending: "Price pending",
		noEntries: "No entries found.",
		reset: "Reset the index",
		close: "Close",
		closeDetails: "Close product details",
		closeFilters: "Close filters",
		filterDialog: "Catalog filters",
		refine: "Refine the shelf",
		store: "Store",
		craving: "What are you craving?",
		maximumPrice: "Maximum price",
		showProducts: "Show matching products",
		fallback: "Japanese original",
		useDark: "Use dark mode",
		useLight: "Use light mode",
		language: "Language",
		languageDescription: "Choose the language used throughout this catalog.",
		applyLanguage: "Use English",
		currentLanguage: "Current language: English",
		edition: "English edition",
		remembered: "Remembered on this device",
	},
	ja: {
		brand: "タコンビニ",
		strapline: "毎週の新商品手帖",
		headline: "小さな新しさを、\nていねいに記録。",
		intro:
			"コンビニの新しいものを、毎週静かに観察し、ていねいにまとめています。",
		searchLabel: "商品を検索",
		searchPlaceholder: "今週の手帖を検索",
		filters: "絞り込み",
		index: "商品一覧",
		selectItem: "商品を選んで詳細を見る",
		noImage: "写真準備中",
		pricePending: "価格未定",
		noEntries: "商品が見つかりませんでした。",
		reset: "条件をリセット",
		close: "閉じる",
		closeDetails: "商品詳細を閉じる",
		closeFilters: "絞り込みを閉じる",
		filterDialog: "商品の絞り込み",
		refine: "商品を絞り込む",
		store: "店舗",
		craving: "気になるカテゴリー",
		maximumPrice: "上限価格",
		showProducts: "該当商品を表示",
		fallback: "英語の原文",
		useDark: "ダークモードに切り替え",
		useLight: "ライトモードに切り替え",
		language: "表示言語",
		languageDescription: "カタログ全体で使用する言語を選択してください。",
		applyLanguage: "日本語で表示",
		currentLanguage: "現在の言語：日本語",
		edition: "日本語版",
		remembered: "この端末に保存されます",
	},
	zh: {
		brand: "TAKONBINI",
		strapline: "每週新品索引",
		headline: "細小的新發現，\n用心整理。",
		intro: "每週靜靜觀察便利商店的新品，並用心整理成一份索引。",
		searchLabel: "搜尋商品",
		searchPlaceholder: "搜尋本週索引",
		filters: "篩選",
		index: "商品索引",
		selectItem: "選擇商品查看詳情",
		noImage: "圖片準備中",
		pricePending: "價格未定",
		noEntries: "找不到符合條件的商品。",
		reset: "重設索引",
		close: "關閉",
		closeDetails: "關閉商品詳情",
		closeFilters: "關閉篩選",
		filterDialog: "商品篩選",
		refine: "縮小商品範圍",
		store: "商店",
		craving: "想找哪一類？",
		maximumPrice: "最高價格",
		showProducts: "顯示符合的商品",
		fallback: "日文原文",
		useDark: "切換至深色模式",
		useLight: "切換至淺色模式",
		language: "顯示語言",
		languageDescription: "選擇整個商品索引使用的語言。",
		applyLanguage: "使用繁體中文",
		currentLanguage: "目前語言：繁體中文",
		edition: "繁體中文版",
		remembered: "將記住於此裝置",
	},
} as const;

export const localizedStores = {
	en: {
		SevenEleven: "7-Eleven",
		Lawson: "Lawson",
		FamilyMart: "FamilyMart",
	},
	ja: {
		SevenEleven: "セブン-イレブン",
		Lawson: "ローソン",
		FamilyMart: "ファミリーマート",
	},
	zh: {
		SevenEleven: "7-Eleven",
		Lawson: "Lawson",
		FamilyMart: "全家便利商店",
	},
} as const;

export const localizedCategories: Record<
	PrototypeLocale,
	Record<string, string>
> = {
	en: {
		Onigiri: "Onigiri",
		Bento: "Bento",
		Noodle: "Noodles",
		Sweets: "Sweets",
		Sandwich: "Sandwiches",
		Drink: "Drinks",
	},
	ja: {
		Onigiri: "おにぎり",
		Bento: "弁当",
		Noodle: "麺類",
		Sweets: "スイーツ",
		Sandwich: "サンドイッチ",
		Drink: "飲料",
	},
	zh: {
		Onigiri: "飯糰",
		Bento: "便當",
		Noodle: "麵類",
		Sweets: "甜點",
		Sandwich: "三明治",
		Drink: "飲料",
	},
};

export function resolvePrototypeText(
	value: PublicProduct["title"] | PublicProduct["description"],
	locale: PrototypeLocale,
) {
	const requested = value[locale]?.trim();
	if (requested) return { text: requested, language: locale, fallback: false };

	const fallbackOrder: Record<PrototypeLocale, PrototypeLocale[]> = {
		en: ["ja", "zh"],
		ja: ["en", "zh"],
		zh: ["ja", "en"],
	};
	for (const fallbackLocale of fallbackOrder[locale]) {
		const fallbackText = value[fallbackLocale]?.trim();
		if (fallbackText) {
			return {
				text: fallbackText,
				language: fallbackLocale,
				fallback: true,
			};
		}
	}
	return { text: "", language: locale, fallback: true };
}

export function formatPrototypePrice(price: number, locale: PrototypeLocale) {
	if (!price) return localizationCopy[locale].pricePending;
	const numberLocale =
		locale === "ja" ? "ja-JP" : locale === "zh" ? "zh-TW" : "en-US";
	return new Intl.NumberFormat(numberLocale, {
		style: "currency",
		currency: "JPY",
		maximumFractionDigits: 0,
	}).format(price);
}
