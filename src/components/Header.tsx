import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";

export default function Header() {
	const { t } = useTranslation();

	return (
		<header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto flex h-14 items-center justify-between px-4">
				<div className="flex">
					<Link to="/" className="mr-6 flex items-center space-x-2">
						<span className="font-bold sm:inline-block">{t("appName")}</span>
					</Link>
				</div>

				<div className="flex items-center gap-2">
					<ThemeSelect />
					<LanguageSelect />
				</div>
			</div>
		</header>
	);
}
