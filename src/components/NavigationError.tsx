import * as stylex from "@stylexjs/stylex";
import {
	type ErrorComponentProps,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { documentLanguage, resolveSupportedLanguage } from "../localization";
import { colors } from "../styles/colors.stylex";

function useNavigationRecovery() {
	const router = useRouter();
	const location = useRouterState({ select: (state) => state.location });
	const { i18n } = useTranslation();
	const language =
		resolveSupportedLanguage(location.search.lang) ??
		resolveSupportedLanguage(i18n.language) ??
		"en";
	const t = i18n.getFixedT(language);
	const catalog = router.buildLocation({
		to: "/",
		search: () => ({ ...location.search, lang: language }),
		state: () => ({}),
	}).href;
	return { router, language, t, catalog };
}

export function NavigationPending() {
	const { language, t, catalog } = useNavigationRecovery();
	const status = useRef<HTMLOutputElement>(null);
	useEffect(() => {
		status.current?.focus();
	}, []);
	return (
		<section lang={documentLanguage(language)} {...stylex.props(styles.screen)}>
			<h1
				aria-label={t("navigationError.loading")}
				{...stylex.props(styles.title)}
			>
				<output ref={status} tabIndex={-1} aria-live="polite">
					{t("navigationError.loading")}
				</output>
			</h1>
			<div {...stylex.props(styles.actions)}>
				<a href={catalog} {...stylex.props(styles.back)}>
					{t("product.details.back")}
				</a>
			</div>
		</section>
	);
}

export default function NavigationError({ error }: ErrorComponentProps) {
	const reloadsPage =
		error instanceof Error &&
		/^(Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed)/.test(
			error.message,
		);
	const { router, language, t, catalog } = useNavigationRecovery();
	const heading = useRef<HTMLHeadingElement>(null);
	const pending = useRef(false);
	const [isRetrying, setIsRetrying] = useState(false);
	const [offline, setOffline] = useState(false);
	useEffect(() => {
		heading.current?.focus();
	}, []);
	const retry = async () => {
		if (pending.current) return;
		if (!navigator.onLine) {
			setOffline(true);
			return;
		}
		setOffline(false);
		pending.current = true;
		setIsRetrying(true);
		if (reloadsPage) {
			window.location.reload();
			return;
		}
		const attempted = router.state.location.href;
		try {
			await router.invalidate();
			if (
				router.state.location.href === attempted &&
				!router.state.matches.some((match) => match.status === "error")
			) {
				(
					document.querySelector<HTMLElement>("dialog[open] button") ??
					document.querySelector<HTMLElement>("main h1")
				)?.focus();
			}
		} finally {
			pending.current = false;
			setIsRetrying(false);
		}
	};

	return (
		<section lang={documentLanguage(language)} {...stylex.props(styles.screen)}>
			<h1 ref={heading} tabIndex={-1} {...stylex.props(styles.title)}>
				{t("navigationError.title")}
			</h1>
			<p {...stylex.props(styles.message)}>
				{t(reloadsPage ? "navigationError.reloadBody" : "navigationError.body")}
			</p>
			<output aria-live="polite" {...stylex.props(styles.message)}>
				{offline
					? t("navigationError.offline")
					: isRetrying
						? t("navigationError.loading")
						: null}
			</output>
			<div {...stylex.props(styles.actions)}>
				<button
					type="button"
					disabled={isRetrying}
					onClick={retry}
					{...stylex.props(styles.retry)}
				>
					{t("product.retry")}
				</button>
				<a href={catalog} {...stylex.props(styles.back)}>
					{t("product.details.back")}
				</a>
			</div>
		</section>
	);
}
const styles = stylex.create({
	screen: {
		maxWidth: "48rem",
		marginInline: "auto",
		paddingInline: "1rem",
		paddingTop: "6rem",
		paddingBottom: "4rem",
		color: colors.foreground,
	},
	title: { fontSize: "1.5rem", lineHeight: "2rem", fontWeight: 600 },
	message: {
		display: "block",
		marginTop: "0.5rem",
		fontSize: "0.875rem",
		lineHeight: "1.5rem",
		color: colors.mutedForeground,
	},
	actions: {
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		gap: "1rem",
		marginTop: "1.5rem",
	},
	retry: {
		minHeight: "44px",
		paddingInline: "1rem",
		border: "1px solid",
		borderColor: colors.border,
		borderRadius: "var(--radius)",
		backgroundColor: colors.card,
		color: colors.foreground,
		fontSize: "0.875rem",
		fontWeight: 600,
		touchAction: "manipulation",
		cursor: { default: "pointer", ":disabled": "wait" },
		opacity: { default: 1, ":disabled": 0.6 },
		outline: { default: null, ":focus-visible": "2px solid" },
		outlineColor: colors.ring,
		outlineOffset: "3px",
		"@media (hover: hover) and (pointer: fine)": {
			backgroundColor: { default: null, ":hover": colors.muted },
		},
	},
	back: {
		display: "inline-flex",
		alignItems: "center",
		minHeight: "44px",
		color: colors.primary,
		fontSize: "0.875rem",
		fontWeight: 600,
		textDecorationLine: { default: null, ":hover": "underline" },
		touchAction: "manipulation",
	},
});
