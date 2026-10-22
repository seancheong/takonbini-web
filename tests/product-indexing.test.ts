import { expect, it } from "vitest";
import { SUPPORTED_LANGUAGES } from "@/localization";
import { productIndexing } from "@/features/products/model/product-indexing";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";

it("keeps complete translations self-canonical and reciprocal", () => {
	for (const locale of SUPPORTED_LANGUAGES) {
		expect(productIndexing(catalogProduct(), locale)).toEqual({
			canonicalLanguage: locale,
			alternateLanguages: ["en", "zh", "ja"],
			sitemapLanguages: ["en", "zh", "ja"],
		});
	}
});

it("consolidates identical fallback content without advertising a missing translation", () => {
	const product = catalogProduct({
		title: { ja: "お茶" },
		description: { ja: "説明" },
	});
	for (const locale of SUPPORTED_LANGUAGES) {
		expect(productIndexing(product, locale)).toEqual({
			canonicalLanguage: "ja",
			alternateLanguages: ["ja"],
			sitemapLanguages: ["ja"],
		});
	}
});

it("preserves a unique mixed translation instead of canonicalizing different content", () => {
	const product = catalogProduct({
		title: { ja: "お茶", en: "Tea" },
		description: { ja: "説明" },
	});
	expect(productIndexing(product, "en")).toEqual({
		canonicalLanguage: "en",
		alternateLanguages: [],
		sitemapLanguages: ["ja"],
	});
	expect(productIndexing(product, "zh").canonicalLanguage).toBe("ja");
});

it("retains discovery of one representative when no complete language exists", () => {
	const product = catalogProduct({
		title: { ja: "お茶" },
		description: { ja: "", en: "Tea" },
	});
	for (const locale of SUPPORTED_LANGUAGES) {
		expect(productIndexing(product, locale)).toEqual({
			canonicalLanguage: "ja",
			alternateLanguages: [],
			sitemapLanguages: ["ja"],
		});
	}
});

it("requires no invented description for a genuinely descriptionless product", () => {
	const product = catalogProduct({
		title: { ja: "お茶", en: "Tea" },
		description: { ja: "  " },
	});
	expect(productIndexing(product, "en")).toEqual({
		canonicalLanguage: "en",
		alternateLanguages: ["en", "ja"],
		sitemapLanguages: ["en", "ja"],
	});
});

it("treats whitespace translations as missing and keeps canonical targets idempotent", () => {
	const product = catalogProduct({
		title: { ja: "  お茶 ", en: "  ", zh: "茶" },
		description: { ja: "説明", zh: "描述" },
	});
	for (const locale of SUPPORTED_LANGUAGES) {
		const result = productIndexing(product, locale);
		expect(
			productIndexing(product, result.canonicalLanguage).canonicalLanguage,
		).toBe(result.canonicalLanguage);
		for (const target of result.alternateLanguages) {
			expect(productIndexing(product, target).canonicalLanguage).toBe(target);
			expect(productIndexing(product, target).alternateLanguages).toEqual(
				result.alternateLanguages,
			);
		}
	}
});
