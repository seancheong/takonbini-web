import LocalizationPrototype from "./LocalizationPrototype";
import type { PrototypeLocale } from "./localizationCopy";

export default function LanguageSheet({
	initialLocale,
}: {
	initialLocale: PrototypeLocale;
}) {
	return <LocalizationPrototype mode="sheet" initialLocale={initialLocale} />;
}
