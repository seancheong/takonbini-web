import * as stylex from "@stylexjs/stylex";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type Theme, useTheme } from "../contexts/ThemeProvider";
import { colors } from "../styles/colors.stylex";
import { conditions } from "../styles/conditions.stylex";
import { metrics } from "../styles/metrics.stylex";
export default function ThemeSelect() {
	const { t } = useTranslation();
	const { setTheme, theme } = useTheme();
	const currentTheme: Theme = theme ?? "system";
	const currentIcon =
		currentTheme === "light" ? (
			<Sun size={16} {...stylex.props(layoutStyles.icon)} />
		) : currentTheme === "dark" ? (
			<Moon size={16} {...stylex.props(layoutStyles.icon)} />
		) : (
			<Laptop size={16} {...stylex.props(layoutStyles.icon)} />
		);
	return (
		<Select
			value={currentTheme}
			onValueChange={(value) => setTheme(value as Theme)}
		>
			<SelectTrigger
				xstyle={styles.trigger}
				aria-label={t("theme.selectTheme")}
			>
				<div {...stylex.props(layoutStyles.row)}>
					{currentIcon}
					<span {...stylex.props(layoutStyles.label)}>
						<SelectValue>{t(`theme.${currentTheme}`)}</SelectValue>
					</span>
				</div>
			</SelectTrigger>

			<SelectContent>
				<SelectItem value="light">
					<div {...stylex.props(layoutStyles.row)}>
						<Sun size={16} {...stylex.props(layoutStyles.icon)} />
						<span>{t("theme.light")}</span>
					</div>
				</SelectItem>

				<SelectItem value="dark">
					<div {...stylex.props(layoutStyles.row)}>
						<Moon size={16} {...stylex.props(layoutStyles.icon)} />
						<span>{t("theme.dark")}</span>
					</div>
				</SelectItem>

				<SelectItem value="system">
					<div {...stylex.props(layoutStyles.row)}>
						<Laptop size={16} {...stylex.props(layoutStyles.icon)} />
						<span>{t("theme.system")}</span>
					</div>
				</SelectItem>
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
		minWidth: "2.75rem",
	},
});
const layoutStyles = stylex.create({
	icon: {
		width: "1rem",
		height: "1rem",
		pointerEvents: "none",
		flexShrink: 0,
		color: colors.mutedForeground,
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: "0.5rem",
	},
	label: {
		display: {
			default: "none",
			[conditions.shellLabels]: "inline",
		},
	},
});
