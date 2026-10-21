import * as stylex from "@stylexjs/stylex";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { colors } from "../../../styles/colors.stylex";
import { productQueries } from "../data/product-queries";
import type { ProductFilters } from "../products.contracts";
export default function ProductDetailError({
	filters,
	id,
	onRecovered,
}: {
	filters: ProductFilters;
	id: string;
	onRecovered: () => void | Promise<void>;
}) {
	const { t } = useTranslation();
	const client = useQueryClient();
	const pending = useRef(false);
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const [isRetrying, setIsRetrying] = useState(false);
	const [retryFailed, setRetryFailed] = useState(false);
	const retry = async () => {
		if (pending.current) return;
		pending.current = true;
		setIsRetrying(true);
		setRetryFailed(false);
		try {
			await client.fetchQuery({ ...productQueries.detail(id), staleTime: 0 });
		} catch {
			setRetryFailed(true);
			pending.current = false;
			setIsRetrying(false);
			return;
		}
		if (!mounted.current) return;
		try {
			await onRecovered();
		} finally {
			pending.current = false;
			setIsRetrying(false);
		}
	};
	return (
		<div {...stylex.props(layoutStyles.screen)}>
			<div {...stylex.props(layoutStyles.container)}>
				<h1 {...stylex.props(layoutStyles.title)}>
					{t("product.details.notFoundTitle")}
				</h1>

				<p {...stylex.props(layoutStyles.message)}>
					{t("product.details.notFoundBody")}
				</p>

				<output aria-live="polite" {...stylex.props(layoutStyles.message)}>
					{isRetrying
						? t("product.details.loading")
						: retryFailed
							? t("product.details.retryError")
							: null}
				</output>
				<button
					type="button"
					disabled={isRetrying}
					onClick={retry}
					{...stylex.props(layoutStyles.retry)}
				>
					{t("product.retry")}
				</button>
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
		minHeight: "calc(100dvh - var(--header-height))",
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
		display: "block",
		marginTop: "0.5rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		color: colors.mutedForeground,
	},
	retry: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		minHeight: "44px",
		marginTop: "1rem",
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
