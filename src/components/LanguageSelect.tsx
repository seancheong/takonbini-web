import * as stylex from "@stylexjs/stylex";
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
import { type Language, SUPPORTED_LANGUAGES } from "@/i18n";
import { colors } from "../styles/colors.stylex";
import { metrics } from "../styles/metrics.stylex";
export default function LanguageSelect() {
	const { t, i18n } = useTranslation();
	const changeLanguage = (language: string) => {
		i18n.changeLanguage(language);
	};
	const currentLanguage = useMemo(() => {
		const language = (i18n.resolvedLanguage ?? i18n.language) as Language;
		return SUPPORTED_LANGUAGES.includes(language)
			? language
			: SUPPORTED_LANGUAGES.find((supportedLanguage) =>
					language?.startsWith(supportedLanguage),
				) || SUPPORTED_LANGUAGES[0];
	}, [i18n.language, i18n.resolvedLanguage]);
	return (
		<Select value={currentLanguage} onValueChange={changeLanguage}>
			<SelectTrigger
				xstyle={styles.trigger}
				aria-label={t("language.changeLanguage")}
			>
				<div {...stylex.props(layoutStyles.row)}>
					<Globe size={16} {...stylex.props(layoutStyles.icon)} />
					<SelectValue>{t(`language.${currentLanguage}`)}</SelectValue>
				</div>
			</SelectTrigger>

			<SelectContent position="popper" align="end">
				{SUPPORTED_LANGUAGES.map((language) => (
					<SelectItem key={language} value={language}>
						{t(`language.${language}`)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
const styles = stylex.create({
	trigger: {
		width: "auto",
		minHeight: metrics.controlTarget,
		borderStyle: "none",
		paddingInline: "0.5rem",
	},
});
const layoutStyles = stylex.create({
	row: {
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
	},
	icon: {
		width: "1rem",
		height: "1rem",
		pointerEvents: "none",
		flexShrink: 0,
		color: colors.mutedForeground,
	},
});
