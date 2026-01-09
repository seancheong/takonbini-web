import { Globe } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/i18n";

export default function LanguageSelect() {
	const { t, i18n } = useTranslation();

	const changeLanguage = (language: string) => {
		i18n.changeLanguage(language);
	};

	const currentLanguage = useMemo(() => {
		const language = (i18n.resolvedLanguage ??
			i18n.language) as (typeof SUPPORTED_LANGUAGES)[number];

		return SUPPORTED_LANGUAGES.includes(language)
			? language
			: SUPPORTED_LANGUAGES.find((supportedLanguage) =>
					language?.startsWith(supportedLanguage),
				) || SUPPORTED_LANGUAGES[0];
	}, [i18n.language, i18n.resolvedLanguage]);

	return (
		<Select value={currentLanguage} onValueChange={changeLanguage}>
			<SelectTrigger
				className="w-35 border-none bg-transparent focus:ring-0 focus:ring-offset-0 px-2"
				aria-label={t("language.changeLanguage")}
			>
				<div className="flex items-center gap-2">
					<Globe size={20} className="text-muted-foreground" />
					<SelectValue>{t(`language.${currentLanguage}`)}</SelectValue>
				</div>
			</SelectTrigger>

			<SelectContent>
				{SUPPORTED_LANGUAGES.map((language) => (
					<SelectItem key={language} value={language}>
						{t(`language.${language}`)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
