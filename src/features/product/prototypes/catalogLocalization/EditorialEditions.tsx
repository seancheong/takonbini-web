import LocalizationPrototype from "./LocalizationPrototype";
import type { PrototypeLocale } from "./localizationCopy";

export default function EditorialEditions({
	initialLocale,
}: {
	initialLocale: PrototypeLocale;
}) {
	return (
		<LocalizationPrototype mode="editions" initialLocale={initialLocale} />
	);
}
