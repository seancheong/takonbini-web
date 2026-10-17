import * as stylex from "@stylexjs/stylex";
import { useTranslation } from "react-i18next";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";

export default function WeeklyMasthead() {
	const { t, i18n } = useTranslation();
	const language = i18n.language;
	const isCjk = language.startsWith("ja") || language.startsWith("zh");
	return (
		<header {...stylex.props(styles.masthead)}>
			<h1
				{...stylex.props(
					styles.title,
					isCjk && styles.cjkTitle,
					language.startsWith("zh") && styles.chinese,
				)}
			>
				{t("product.title")}
			</h1>
			<p
				{...stylex.props(
					styles.intro,
					isCjk && styles.cjkIntro,
					language.startsWith("zh") && styles.chinese,
				)}
			>
				{t("product.subtitle")}
			</p>
		</header>
	);
}

const styles = stylex.create({
	masthead: {
		display: "grid",
		gridTemplateColumns: {
			default: "1fr",
			[conditions.indexDesktop]: "1.4fr 0.6fr",
		},
		alignItems: "end",
		gap: { default: "1.125rem", [conditions.indexDesktop]: "3.5rem" },
		minHeight: { default: 0, [conditions.indexDesktop]: "12.625rem" },
		paddingTop: "2.125rem",
		paddingBottom: "1.625rem",
		fontFamily:
			'"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", Georgia, serif',
		lineBreak: "strict",
		overflowWrap: "anywhere",
	},
	title: {
		maxWidth: "14ch",
		fontSize: "clamp(2.375rem, 4.5vw, 3.875rem)",
		fontWeight: 400,
		letterSpacing: "-0.055em",
		lineHeight: 1,
		textWrap: "balance",
	},
	cjkTitle: {
		maxWidth: "none",
		fontSize: "clamp(2.125rem, 4vw, 3.375rem)",
		letterSpacing: "0.015em",
		lineHeight: 1.25,
	},
	intro: {
		maxWidth: { default: "none", [conditions.indexDesktop]: "17.5rem" },
		color: colors.mutedForeground,
		fontSize: { default: "0.875rem", [conditions.indexDesktop]: "1rem" },
		lineHeight: 1.95,
	},
	cjkIntro: { letterSpacing: "0.045em", lineHeight: 2.05 },
	chinese: { fontFamily: '"Songti TC", "Noto Serif TC", "PMingLiU", serif' },
});
