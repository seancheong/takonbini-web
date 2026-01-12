import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ScrollTopButton() {
	const { t } = useTranslation();
	const [showScrollTop, setShowScrollTop] = useState(false);

	useEffect(() => {
		const updateScroll = () => {
			setShowScrollTop(window.scrollY > 120);
		};

		updateScroll();
		window.addEventListener("scroll", updateScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", updateScroll);
		};
	}, []);

	if (!showScrollTop) return null;

	return (
		<button
			type="button"
			aria-label={t("product.scrollTop")}
			onClick={() => {
				window.scrollTo({ top: 0, behavior: "smooth" });
			}}
			className="fixed bottom-6 right-6 inline-flex items-center justify-center rounded-full border border-primary bg-primary p-3 text-primary-foreground shadow-sm transition hover:bg-primary/90 dark:border-primary/60"
		>
			<ArrowUp className="h-5 w-5" aria-hidden="true" />
		</button>
	);
}
