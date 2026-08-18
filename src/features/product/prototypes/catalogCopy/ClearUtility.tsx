import LocalizationPrototype from "../catalogLocalization/LocalizationPrototype";
import type { PrototypeLocale } from "../catalogLocalization/localizationCopy";
import { clearUtilityCopy } from "./mastheadCopy";

export default function ClearUtility({
	initialLocale,
}: {
	initialLocale: PrototypeLocale;
}) {
	return (
		<LocalizationPrototype
			mode="direct"
			initialLocale={initialLocale}
			mastheadCopy={clearUtilityCopy}
			prototypePath="/prototypes/catalog-copy"
			prototypeVariant={1}
		/>
	);
}
