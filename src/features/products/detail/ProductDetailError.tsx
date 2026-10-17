import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { colors } from "../../../styles/colors.stylex";
import type { ProductFilters } from "../products.contracts";
export default function ProductDetailError({
	filters,
}: {
	filters: ProductFilters;
}) {
	const { t } = useTranslation();
	return (
		<div {...stylex.props(layoutStyles.screen)}>
			<div {...stylex.props(layoutStyles.container)}>
				<h1 {...stylex.props(layoutStyles.title)}>
					{t("product.details.notFoundTitle")}
				</h1>

				<p {...stylex.props(layoutStyles.message)}>
					{t("product.details.notFoundBody")}
				</p>

				<Link to="/" search={filters} {...stylex.props(layoutStyles.back)}>
					<ArrowLeft aria-hidden="true" {...stylex.props(layoutStyles.icon)} />
					{t("product.details.back")}
				</Link>
			</div>
		</div>
	);
}
const layoutStyles = stylex.create({
	screen: {
		minHeight: "100vh",
		backgroundColor: colors.background,
		paddingLeft: "1rem",
		paddingRight: "1rem",
		paddingBottom: "4rem",
		paddingTop: "6rem",
	},
	container: {
		marginLeft: "auto",
		marginRight: "auto",
		width: "100%",
		maxWidth: "48rem",
	},
	title: {
		fontSize: "1.5rem",
		lineHeight: "2rem",
		fontWeight: 600,
		color: colors.foreground,
	},
	message: {
		marginTop: "0.5rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		color: colors.mutedForeground,
	},
	back: {
		marginTop: "1.5rem",
		display: "inline-flex",
		alignItems: "center",
		gap: "0.5rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		fontWeight: 600,
		color: colors.primary,
		textDecorationLine: {
			default: null,
			":hover": "underline",
		},
	},
	icon: {
		height: "1rem",
		width: "1rem",
	},
});
