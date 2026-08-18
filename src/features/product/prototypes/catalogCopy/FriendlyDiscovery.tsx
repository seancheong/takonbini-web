import LocalizationPrototype from "../catalogLocalization/LocalizationPrototype";
import type { PrototypeLocale } from "../catalogLocalization/localizationCopy";
import { friendlyDiscoveryCopy } from "./mastheadCopy";

export default function FriendlyDiscovery({
	initialLocale,
}: {
	initialLocale: PrototypeLocale;
}) {
	return (
		<LocalizationPrototype
			mode="direct"
			initialLocale={initialLocale}
			mastheadCopy={friendlyDiscoveryCopy}
			prototypePath="/prototypes/catalog-copy"
			prototypeVariant={3}
		/>
	);
}
