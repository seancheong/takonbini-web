import LocalizationPrototype from "./LocalizationPrototype";
import type { PrototypeLocale } from "./localizationCopy";

export default function DirectLocale({
	initialLocale,
}: {
	initialLocale: PrototypeLocale;
}) {
	return <LocalizationPrototype mode="direct" initialLocale={initialLocale} />;
}
