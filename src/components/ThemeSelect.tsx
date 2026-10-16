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

export default function ThemeSelect() {
	const { t } = useTranslation();
	const { setTheme, theme } = useTheme();

	const currentTheme: Theme = theme ?? "system";
	const currentIcon =
		currentTheme === "light" ? (
			<Sun size={16} />
		) : currentTheme === "dark" ? (
			<Moon size={16} />
		) : (
			<Laptop size={16} />
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
				<div className="flex items-center gap-2">
					{currentIcon}
					<span className="hidden sm:inline">
						<SelectValue>{t(`theme.${currentTheme}`)}</SelectValue>
					</span>
				</div>
			</SelectTrigger>

			<SelectContent>
				<SelectItem value="light">
					<div className="flex items-center gap-2">
						<Sun size={16} />
						<span>{t("theme.light")}</span>
					</div>
				</SelectItem>

				<SelectItem value="dark">
					<div className="flex items-center gap-2">
						<Moon size={16} />
						<span>{t("theme.dark")}</span>
					</div>
				</SelectItem>

				<SelectItem value="system">
					<div className="flex items-center gap-2">
						<Laptop size={16} />
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
		minHeight: "2.75rem",
		borderStyle: "none",
		paddingInline: "0.5rem",
		minWidth: "2.75rem",
	},
});
