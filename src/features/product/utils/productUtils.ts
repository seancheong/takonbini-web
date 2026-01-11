import type { PublicProduct } from "@/@types/product";
import type { Language } from "@/i18n";

export type LocalizedText = PublicProduct["title"] | PublicProduct["description"];

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
