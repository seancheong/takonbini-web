import type { PublicProduct } from "@/@types/product";
import type { Language } from "@/i18n";

export type LocalizedText =
	| PublicProduct["title"]
	| PublicProduct["description"];

export const resolveLocalizedText = (
	localizedText: LocalizedText,
	language: Language,
) => localizedText[language] || localizedText.en || localizedText.ja || "";

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
