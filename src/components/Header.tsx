import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";

export default function Header() {
	const { t } = useTranslation();

	return (
		<header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto flex h-14 items-center justify-between px-3 sm:px-4">
				<div className="flex min-w-0">
					<Link
						to="/"
						className="mr-3 flex min-w-0 items-center space-x-2 sm:mr-6"
					>
						<span className="whitespace-nowrap font-bold text-sm sm:inline-block sm:text-base">
							{t("appName")}
						</span>
					</Link>
				</div>

				<div className="flex shrink-0 items-center gap-1 sm:gap-2">
					<ThemeSelect />
					<LanguageSelect />
				</div>
			</div>
		</header>
	);
}
