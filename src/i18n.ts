import { createIsomorphicFn } from "@tanstack/react-start";
import {
	getCookie,
	getRequestHeader,
	setCookie,
} from "@tanstack/react-start/server";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ja from "./locales/ja";
import zh from "./locales/zh";

export const SUPPORTED_LANGUAGES = ["en", "zh", "ja"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const defaultNS = "translation";
export const i18nCookieName = "i18nextTakonbiniLng";
const oneYearInSeconds = 60 * 60 * 24 * 365;

const resolveSupportedLanguage = (language?: string) => {
	if (!language) return undefined;

	const normalized = language.toLowerCase();
	const exactMatch = SUPPORTED_LANGUAGES.find(
		(supportedLanguage) => supportedLanguage === normalized,
	);

	if (exactMatch) return exactMatch;

	return SUPPORTED_LANGUAGES.find((supportedLanguage) =>
		normalized.startsWith(supportedLanguage),
	);
};

const resolveLanguageFromHeader = (acceptLanguage?: string) => {
	if (!acceptLanguage) return undefined;

	const candidates = acceptLanguage
		.split(",")
		.map((entry) => entry.split(";")[0]?.trim())
		.filter(Boolean) as string[];

	for (const candidate of candidates) {
		const match = resolveSupportedLanguage(candidate);
		if (match) return match;
	}

	return undefined;
};

i18n
	// detect user language
	.use(LanguageDetector)
	// pass the i18n instance to react-i18next.
	.use(initReactI18next)
	.init({
		resources: {
			en,
			zh,
			ja,
		},
		defaultNS,
		fallbackLng: SUPPORTED_LANGUAGES[0],
		supportedLngs: SUPPORTED_LANGUAGES,

		detection: {
			order: ["cookie", "navigator", "htmlTag"],
			lookupCookie: i18nCookieName,
			caches: ["cookie"],
			cookieMinutes: 60 * 24 * 365, // 1 year
		},

		interpolation: {
			escapeValue: false, // not needed for react as it escapes by default
		},
	});

export const setSSRLanguage = createIsomorphicFn().server(async () => {
	const cookieLanguage = getCookie(i18nCookieName);
	const resolvedCookie = resolveSupportedLanguage(cookieLanguage);
	const headerLanguage = resolveLanguageFromHeader(
		getRequestHeader("accept-language"),
	);
	const resolvedLanguage =
		resolvedCookie || headerLanguage || SUPPORTED_LANGUAGES[0];

	await i18n.changeLanguage(resolvedLanguage);

	if (!resolvedCookie) {
		setCookie(i18nCookieName, resolvedLanguage, {
			path: "/",
			maxAge: oneYearInSeconds,
		});
	}
});

export default i18n;
