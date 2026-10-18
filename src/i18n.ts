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

import { resolveInitialLanguage, SUPPORTED_LANGUAGES } from "./localization";

export { type Language, SUPPORTED_LANGUAGES } from "./localization";

export const defaultNS = "translation";
export const i18nCookieName = "i18nextTakonbiniLng";
const oneYearInSeconds = 60 * 60 * 24 * 365;

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
			order: ["querystring", "cookie", "navigator", "htmlTag"],
			lookupQuerystring: "lang",
			lookupCookie: i18nCookieName,
			caches: ["cookie"],
			cookieMinutes: 60 * 24 * 365, // 1 year
		},

		interpolation: {
			escapeValue: false, // not needed for react as it escapes by default
		},
	});

export const setSSRLanguage = createIsomorphicFn()
	.server(async (urlLanguage?: string) => {
		const saved = getCookie(i18nCookieName);
		const language = resolveInitialLanguage({
			url: urlLanguage,
			saved,
			browser: getRequestHeader("accept-language"),
		});
		await i18n.changeLanguage(language);
		if (urlLanguage || !saved) {
			setCookie(i18nCookieName, language, {
				path: "/",
				maxAge: oneYearInSeconds,
			});
		}
	})
	.client(async (urlLanguage?: string) => {
		if (urlLanguage) await i18n.changeLanguage(urlLanguage);
	});

export default i18n;
