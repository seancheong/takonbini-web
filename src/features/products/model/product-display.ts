import type { ActiveCatalogProduct } from "@/features/products/products.contracts";
import type { Language } from "@/i18n";

export type LocalizedText =
	| ActiveCatalogProduct["title"]
	| ActiveCatalogProduct["description"];

const fallbackOrder: Record<Language, Language[]> = {
	en: ["ja", "zh"],
	ja: ["en", "zh"],
	zh: ["ja", "en"],
};

export function resolveProductText(
	localizedText: LocalizedText,
	requested: Language,
) {
	for (const language of [requested, ...fallbackOrder[requested]]) {
		const text = localizedText[language]?.trim();
		if (text) return { text, language, fallback: language !== requested };
	}
	return { text: "", language: requested, fallback: false };
}

export const resolveLocalizedText = (text: LocalizedText, language: Language) =>
	resolveProductText(text, language).text;

const resolveCurrencyLocale = (language: Language) => {
	if (language === "ja") return "ja-JP";
	if (language === "zh") return "zh-TW";

	return "en-US";
};

export const formatPrice = (price: number, language: Language) =>
	new Intl.NumberFormat(resolveCurrencyLocale(language), {
		style: "currency",
		currency: "JPY",
		maximumFractionDigits: 0,
	}).format(price);

const jstDateFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Asia/Tokyo",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

const normalizeJstDate = (value: string): string | null => {
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
	if (/^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
		return value.replace(/\//g, "-");
	}

	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) return null;

	return jstDateFormatter.format(new Date(parsed));
};

export const isFutureReleaseDate = (releaseDate?: string | null) => {
	if (!releaseDate) return false;

	const normalized = normalizeJstDate(releaseDate);
	if (!normalized) return false;

	const todayJst = jstDateFormatter.format(new Date());
	return normalized > todayJst;
};
