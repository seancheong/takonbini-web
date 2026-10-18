import { describe, expect, it } from "vitest";
import { resolveProductText } from "@/features/products/model/product-display";
import {
	documentLanguage,
	parseLocaleSearch,
	resolveInitialLanguage,
	resolveSupportedLanguage,
} from "@/localization";

describe("locale resolution", () => {
	it("resolves URL, saved choice, weighted browser preferences, then English", () => {
		expect(
			resolveInitialLanguage({ url: "zh-TW", saved: "ja", browser: "en" }),
		).toBe("zh");
		expect(
			resolveInitialLanguage({ url: "fr", saved: "ja", browser: "en" }),
		).toBe("ja");
		expect(
			resolveInitialLanguage({ browser: "fr, en;q=0.2, ja-JP;q=0.9, zh;q=0" }),
		).toBe("ja");
		expect(resolveInitialLanguage({ browser: "fr, ja;q=0" })).toBe("en");
	});
	it("accepts supported regional tags without accepting arbitrary prefixes", () => {
		expect(resolveSupportedLanguage(" zh_Hant_TW ")).toBe("zh");
		expect(resolveSupportedLanguage("english")).toBeUndefined();
		expect(parseLocaleSearch({ lang: ["ja"] })).toEqual({ lang: undefined });
		expect(documentLanguage("zh")).toBe("zh-Hant");
	});
});

describe("per-field retailer text", () => {
	it("uses the approved requested/Japanese/other fallback order and reports the actual language", () => {
		expect(resolveProductText({ ja: "日本語", en: "English" }, "zh")).toEqual({
			text: "日本語",
			language: "ja",
			fallback: true,
		});
		expect(
			resolveProductText({ ja: " ", en: "English", zh: "中文" }, "ja"),
		).toEqual({ text: "English", language: "en", fallback: true });
		expect(resolveProductText({ ja: " ", zh: "中文" }, "en")).toEqual({
			text: "中文",
			language: "zh",
			fallback: true,
		});
	});
	it("resolves title and description independently and does not label absent content", () => {
		expect(resolveProductText({ ja: "題名", en: "Title" }, "en").fallback).toBe(
			false,
		);
		expect(resolveProductText({ ja: "説明", en: " " }, "en")).toEqual({
			text: "説明",
			language: "ja",
			fallback: true,
		});
		expect(resolveProductText({ ja: "" }, "en").text).toBe("");
	});
});
