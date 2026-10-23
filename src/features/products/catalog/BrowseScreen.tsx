import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { DiscoveryPage } from "../discovery";
import ProductGrid from "./ProductGrid";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
export function BrowseMissingScreen() {
	const { t } = useTranslation();
	return (
		<main {...stylex.props(styles.main)}>
			<h1>{t("browse.missing")}</h1>
			<Link
				to="/browse"
				search={{ after: undefined }}
				{...stylex.props(styles.link)}
			>
				{t("browse.first")}
			</Link>
		</main>
	);
}
export function BrowseScreen({
	page,
	after,
}: {
	page: DiscoveryPage;
	after?: string;
}) {
	const { t } = useTranslation();
	const heading = useRef<HTMLHeadingElement>(null);
	const previousAfter = useRef(after);
	useEffect(() => {
		if (previousAfter.current !== after) {
			previousAfter.current = after;
			heading.current?.focus({ preventScroll: true });
		}
	}, [after]);
	return (
		<main {...stylex.props(styles.main)}>
			<div {...stylex.props(styles.intro)}>
				<Link to="/" {...stylex.props(styles.link)}>
					{t("browse.home")}
				</Link>
				<h1 ref={heading} tabIndex={-1} {...stylex.props(styles.title)}>
					{t("browse.title")}
				</h1>
				<p {...stylex.props(styles.description)}>{t("browse.description")}</p>
			</div>
			{page.products.length ? (
				<ProductGrid products={page.products} />
			) : (
				<p>{t("browse.empty")}</p>
			)}
			<nav
				aria-label={t("browse.navigation")}
				{...stylex.props(styles.navigation)}
			>
				{after && (
					<Link
						to="/browse"
						search={{ after: undefined }}
						preload={false}
						{...stylex.props(styles.link)}
					>
						{t("browse.first")}
					</Link>
				)}
				{page.nextAfter ? (
					<Link
						to="/browse"
						search={{ after: page.nextAfter }}
						preload={false}
						{...stylex.props(styles.link)}
					>
						{t("browse.next")}
					</Link>
				) : (
					<p>{t("browse.end")}</p>
				)}
			</nav>
		</main>
	);
}
const styles = stylex.create({
	main: {
		maxWidth: "1200px",
		marginInline: "auto",
		paddingInline: { default: "40px", [conditions.compactCatalog]: "20px" },
		paddingBlock: "40px",
	},
	intro: { marginBottom: "36px" },
	title: {
		fontSize: "2rem",
		lineHeight: 1.2,
		fontWeight: 650,
		marginBlock: "20px 12px",
	},
	description: {
		color: colors.mutedForeground,
		lineHeight: 1.65,
		maxWidth: "65ch",
	},
	navigation: {
		display: "flex",
		flexWrap: "wrap",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "20px",
		marginTop: "40px",
	},
	link: {
		display: "inline-flex",
		alignItems: "center",
		minHeight: "44px",
		color: colors.foreground,
		textDecoration: "underline",
		textUnderlineOffset: "4px",
		borderRadius: "4px",
		outlineOffset: "4px",
		":focus-visible": {
			outlineWidth: "2px",
			outlineStyle: "solid",
			outlineColor: colors.ring,
		},
	},
});
