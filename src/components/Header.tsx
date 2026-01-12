import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";

export default function Header() {
	const { t } = useTranslation();

	return (
		<header className="fixed top-0 z-50 w-full border-b border-border/50 bg-card/95 shadow-sm backdrop-blur px-4 supports-backdrop-filter:bg-card/90">
			<div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between">
				<div className="flex min-w-0">
					<Link
						to="/"
						className="mr-3 flex min-w-0 items-center space-x-2 sm:mr-6"
					>
						<img
							src="/icon.svg"
							alt="Takonbini Logo"
							className="hidden h-6 w-6 sm:block"
						/>
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
