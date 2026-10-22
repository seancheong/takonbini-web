import { type Language, SUPPORTED_LANGUAGES } from "@/localization";
import type { ActiveCatalogProduct } from "../products.contracts";
import { resolveProductText } from "./product-display";

type ProductText = Pick<ActiveCatalogProduct, "title" | "description">;

export function productIndexing(product: ProductText, requested: Language) {
	const hasDescription = SUPPORTED_LANGUAGES.some((language) =>
		product.description[language]?.trim(),
	);
	const languages = SUPPORTED_LANGUAGES.filter(
		(language) =>
			product.title[language]?.trim() &&
			(!hasDescription || product.description[language]?.trim()),
	);
	const content = (language: Language) => ({
		title: resolveProductText(product.title, language),
		description: resolveProductText(product.description, language),
	});
	const canonicalLanguage = (language: Language): Language => {
		if (languages.includes(language)) return language;
		const resolved = content(language);
		const matches = SUPPORTED_LANGUAGES.filter((candidate) => {
			const other = content(candidate);
			return (
				resolved.title.text === other.title.text &&
				resolved.description.text === other.description.text
			);
		});
		return (
			languages.find((candidate) => matches.includes(candidate)) ??
			[
				resolved.title.language,
				resolved.description.language,
				...SUPPORTED_LANGUAGES,
			].find((candidate) => matches.includes(candidate)) ??
			language
		);
	};
	const canonical = canonicalLanguage(requested);
	return {
		canonicalLanguage: canonical,
		alternateLanguages: languages.includes(canonical) ? languages : [],
		sitemapLanguages: languages.length ? languages : [canonicalLanguage("ja")],
	};
}
