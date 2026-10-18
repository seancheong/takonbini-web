import { createIsomorphicFn } from "@tanstack/react-start";
import {
	getCookie,
	getRequestHeader,
	setCookie,
} from "@tanstack/react-start/server";
import i18n, { createInstance, type i18n as I18n } from "i18next";
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
const resources = { en, zh, ja };

i18n
	// detect user language
	.use(LanguageDetector)
	// pass the i18n instance to react-i18next.
	.use(initReactI18next)
	.init({
		resources,
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
	.server(async (instance: I18n, urlLanguage?: string) => {
		const saved = getCookie(i18nCookieName);
		const language = resolveInitialLanguage({
			url: urlLanguage,
			saved,
			browser: getRequestHeader("accept-language"),
		});
		await instance.changeLanguage(language);
		if (urlLanguage || !saved) {
			setCookie(i18nCookieName, language, {
				path: "/",
				maxAge: oneYearInSeconds,
			});
		}
	})
	.client(async (instance: I18n, urlLanguage?: string) => {
		if (urlLanguage) await instance.changeLanguage(urlLanguage);
	});

export const getRouterI18n = createIsomorphicFn()
	.server(() => {
		const instance = createInstance();
		void instance.init({
			resources,
			defaultNS,
			lng: SUPPORTED_LANGUAGES[0],
			fallbackLng: SUPPORTED_LANGUAGES[0],
			supportedLngs: SUPPORTED_LANGUAGES,
			initAsync: false,
			interpolation: { escapeValue: false },
		});
		return instance;
	})
	.client(() => i18n);

export default i18n;
