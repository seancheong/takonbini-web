import * as stylex from "@stylexjs/stylex";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { colors } from "../styles/colors.stylex";
import { conditions } from "../styles/conditions.stylex";

export default function ScrollTopButton() {
	const { t } = useTranslation();
	const [ready, setReady] = useState(false);
	const [showScrollTop, setShowScrollTop] = useState(false);

	useEffect(() => {
		setReady(true);
		const updateScroll = () => {
			setShowScrollTop(window.scrollY > 120);
		};

		updateScroll();
		window.addEventListener("scroll", updateScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", updateScroll);
		};
	}, []);

	if (!ready) return null;

	return (
		<button
			type="button"
			data-slot="scroll-top"
			hidden={!showScrollTop}
			aria-label={t("product.scrollTop")}
			onClick={() => {
				window.scrollTo({
					top: 0,
					behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")
						.matches
						? "auto"
						: "smooth",
				});
			}}
			{...stylex.props(styles.button)}
		>
			<ArrowUp {...stylex.props(styles.icon)} aria-hidden="true" />
		</button>
	);
}

const styles = stylex.create({
	button: {
		position: "fixed",
		bottom: "max(1.5rem, env(safe-area-inset-bottom))",
		right: "max(1.5rem, env(safe-area-inset-right))",
		zIndex: 10,
		touchAction: "manipulation",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: "9999px",
		borderWidth: 1,
		borderStyle: "solid",
		borderColor: colors.scrollTopBorder,
		backgroundColor: {
			default: colors.primary,
			":hover": "color-mix(in oklab, var(--primary) 90%, transparent)",
		},
		padding: "0.75rem",
		color: colors.primaryForeground,
		transitionProperty: "background-color, border-color",
		transitionDuration: {
			default: "150ms",
			[conditions.reducedMotion]: "0ms",
		},
		transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
	},
	icon: { width: "1.25rem", height: "1.25rem" },
});
