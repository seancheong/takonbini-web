import * as stylex from "@stylexjs/stylex";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { colors } from "../styles/colors.stylex";
import { conditions } from "../styles/conditions.stylex";

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
		bottom: "1.5rem",
		right: "1.5rem",
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
		boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
		transitionProperty: "background-color, border-color, box-shadow",
		transitionDuration: {
			default: "150ms",
			[conditions.reducedMotion]: "0ms",
		},
		transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
	},
	icon: { width: "1.25rem", height: "1.25rem" },
});
