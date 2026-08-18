import LocalizationPrototype from "../catalogLocalization/LocalizationPrototype";
import type { PrototypeLocale } from "../catalogLocalization/localizationCopy";
import { weeklyEditorialCopy } from "./mastheadCopy";

export default function WeeklyEditorial({
	initialLocale,
}: {
	initialLocale: PrototypeLocale;
}) {
	return (
		<LocalizationPrototype
			mode="direct"
			initialLocale={initialLocale}
			mastheadCopy={weeklyEditorialCopy}
			prototypePath="/prototypes/catalog-copy"
			prototypeVariant={2}
		/>
	);
}
