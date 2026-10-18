import * as stylex from "@stylexjs/stylex";
import { useRouter } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { navigateLocale } from "../locale-navigation";
import { resolveSupportedLanguage } from "../localization";
import { colors } from "../styles/colors.stylex";
import { metrics } from "../styles/metrics.stylex";
export default function LanguageSelect() {
	const { t, i18n } = useTranslation();
	const router = useRouter();
	const [announcement, setAnnouncement] = useState("");
	const changeLanguage = (value: string) => {
		const language = resolveSupportedLanguage(value);
		if (!language) return;
		void i18n.changeLanguage(language).then(() => {
			setAnnouncement(
				i18n.t("language.changed", {
					language: i18n.t(`language.${language}`),
				}),
			);
		});
		void navigateLocale(router, language);
	};
	const currentLanguage =
		resolveSupportedLanguage(i18n.resolvedLanguage ?? i18n.language) ?? "en";
	return (
		<>
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
			<output aria-live="polite" {...stylex.props(layoutStyles.announcement)}>
				{announcement}
			</output>
		</>
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
	announcement: {
		position: "absolute",
		width: "1px",
		height: "1px",
		padding: 0,
		overflow: "hidden",
		clipPath: "inset(50%)",
		whiteSpace: "nowrap",
	},
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
