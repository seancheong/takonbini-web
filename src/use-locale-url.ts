import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { navigateLocale } from "./locale-navigation";
import { resolveSupportedLanguage } from "./localization";

export function useLocaleUrl() {
	const router = useRouter();
	const { i18n } = useTranslation();
	const urlLanguage = useRouterState({
		select: (state) => resolveSupportedLanguage(state.location.search.lang),
	});
	useEffect(() => {
		if (!urlLanguage) {
			void navigateLocale(
				router,
				resolveSupportedLanguage(i18n.language) ?? "en",
			);
		}
	}, [router, urlLanguage, i18n.language]);
}
