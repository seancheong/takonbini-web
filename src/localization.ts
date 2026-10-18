export const SUPPORTED_LANGUAGES = ["en", "zh", "ja"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export function resolveSupportedLanguage(
	value?: unknown,
): Language | undefined {
	if (typeof value !== "string") return undefined;
	const base = value.trim().toLowerCase().split(/[-_]/)[0];
	return SUPPORTED_LANGUAGES.find((language) => language === base);
}

export function resolveInitialLanguage({
	url,
	saved,
	browser,
}: {
	url?: unknown;
	saved?: unknown;
	browser?: string;
}): Language {
	const preferences = (browser ?? "")
		.split(",")
		.map((entry, index) => {
			const [tag, ...parameters] = entry.trim().split(";");
			const quality = parameters.find((value) => value.trim().startsWith("q="));
			return {
				tag,
				quality: quality ? Number(quality.trim().slice(2)) : 1,
				index,
			};
		})
		.filter((entry) => entry.quality > 0 && entry.quality <= 1)
		.sort((a, b) => b.quality - a.quality || a.index - b.index);
	return (
		resolveSupportedLanguage(url) ??
		resolveSupportedLanguage(saved) ??
		preferences.map(({ tag }) => resolveSupportedLanguage(tag)).find(Boolean) ??
		"en"
	);
}

export const parseLocaleSearch = (
	search: Record<string, unknown>,
): { lang?: Language } => ({
	lang: resolveSupportedLanguage(search.lang),
});

export const documentLanguage = (language: Language) =>
	language === "zh" ? "zh-Hant" : language;
