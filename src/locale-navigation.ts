import type { AnyRouter } from "@tanstack/react-router";
import type { Language } from "./localization";

export function navigateLocale(router: AnyRouter, lang: Language) {
	const location = router.state.location;
	const masked = location.maskedLocation;
	return router.navigate({
		to: location.pathname,
		search: { ...location.search, lang },
		hash: location.hash,
		state: (previous) => ({ ...previous }),
		replace: true,
		resetScroll: false,
		...(masked && {
			mask: {
				to: masked.pathname,
				search: { ...masked.search, lang },
				hash: masked.hash,
				unmaskOnReload: true,
			},
		}),
	});
}
