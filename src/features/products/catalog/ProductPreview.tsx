import "../model/catalog-navigation";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Language } from "@/i18n";
import { storeTextStyles } from "@/styles/stores.stylex";
import { colors } from "../../../styles/colors.stylex";
import { formatPrice, resolveLocalizedText } from "../model/product-display";
import { getProxiedImageUrl } from "../model/product-images";
import { categoryLabelKeys, storeLabelKeys } from "../model/product-labels";
import type {
	ActiveCatalogProduct,
	ProductFilters,
} from "../products.contracts";

interface ProductPreviewProps {
	product: ActiveCatalogProduct;
	filters: ProductFilters;
	onClose: () => void;
}
export default function ProductPreview({
	product,
	filters,
	onClose,
}: ProductPreviewProps) {
	const { t, i18n } = useTranslation();
	const language = i18n.language as Language;
	const title = resolveLocalizedText(product.title, language);
	const description = resolveLocalizedText(product.description, language);
	const titleId = useId();
	const dialog = useRef<HTMLDialogElement>(null);
	const [imageError, setImageError] = useState(false);
	useEffect(() => {
		const focused = document.activeElement;
		const previousOverflow = document.body.style.overflow;
		dialog.current?.showModal();
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
			if (focused instanceof HTMLElement)
				focused.focus({ preventScroll: true });
		};
	}, []);
	return (
		<dialog
			ref={dialog}
			{...stylex.props(styles.dialog)}
			aria-labelledby={titleId}
			onClose={onClose}
		>
			<article {...stylex.props(styles.article)}>
				<button
					type="button"
					{...stylex.props(styles.close)}
					aria-label={t("product.details.close")}
					onClick={() => dialog.current?.close()}
				>
					<X size={20} />
				</button>
				<div {...stylex.props(styles.imageCanvas)}>
					{product.images[0] && !imageError ? (
						<img
							{...stylex.props(styles.image)}
							src={getProxiedImageUrl(product.images[0])}
							alt={title}
							onError={() => setImageError(true)}
							decoding="async"
						/>
					) : (
						<span>{t("product.noImage")}</span>
					)}
				</div>
				<div {...stylex.props(styles.copy)}>
					<p
						{...stylex.props(styles.store, storeTextStyles[product.store])}
						data-store={product.store}
					>
						{t(storeLabelKeys[product.store])}
						{product.category
							? ` / ${t(categoryLabelKeys[product.category])}`
							: ""}
					</p>
					<h2 id={titleId} {...stylex.props(styles.title)}>
						{title}
					</h2>
					{language !== "ja" && (
						<p {...stylex.props(styles.japanese)} lang="ja">
							{product.title.ja}
						</p>
					)}
					<strong {...stylex.props(styles.price)}>
						{product.price === 0
							? t("product.priceUnknown")
							: formatPrice(product.price, language)}
						{product.price > 0 && (
							<small {...stylex.props(styles.tax)}>
								{t("product.taxIncluded")}
							</small>
						)}
					</strong>
					{description && (
						<p {...stylex.props(styles.description)}>{description}</p>
					)}
					<p {...stylex.props(styles.note)}>{t("product.availabilityNote")}</p>
					<div {...stylex.props(styles.links)}>
						<Link
							to="/products/$id"
							params={{ id: product.id }}
							search={filters}
							state={() => ({
								fromCatalog: true,
								catalogScrollY: window.scrollY,
							})}
							{...stylex.props(styles.details)}
						>
							{t("product.details.fullDetails")}
						</Link>
						<a href={product.url} target="_blank" rel="noreferrer">
							{t("product.details.source")}
							<ExternalLink size={15} />
						</a>
					</div>
				</div>
			</article>
		</dialog>
	);
}

const styles = stylex.create({
	article: { position: "relative" },
	dialog: {
		margin: "auto",
		width: "min(540px,calc(100% - 32px))",
		maxHeight: "calc(100dvh - 32px)",
		padding: 0,
		border: "1px solid",
		borderColor: colors.border,
		borderRadius: "6px",
		backgroundColor: colors.background,
		color: colors.foreground,
		overflowY: "auto",
		overscrollBehavior: "contain",
	},
	close: {
		position: "absolute",
		top: "12px",
		right: "12px",
		zIndex: 2,
		width: "44px",
		height: "44px",
		display: "grid",
		placeItems: "center",
		borderRadius: "50%",
		backgroundColor: colors.background,
		border: "1px solid",
		borderColor: colors.border,
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
	},
	imageCanvas: {
		position: "relative",
		height: "clamp(230px,37dvh,360px)",
		overflow: "hidden",
		display: "grid",
		placeItems: "center",
		backgroundColor: colors.imageCanvas,
		color: colors.imagePlaceholder,
	},
	image: {
		position: "absolute",
		inset: 0,
		width: "100%",
		height: "100%",
		objectFit: "contain",
		padding: "12px",
	},
	copy: { padding: "24px" },
	store: {
		fontSize: "10px",
		letterSpacing: ".08em",
		textTransform: "uppercase",
		marginBottom: "12px",
	},
	title: {
		fontSize: "26px",
		fontWeight: 500,
		lineHeight: 1.2,
		letterSpacing: "-.025em",
		textWrap: "pretty",
		marginBottom: "10px",
	},
	japanese: {
		fontSize: "13px",
		color: colors.mutedForeground,
		lineHeight: 1.7,
		marginBottom: "20px",
	},
	price: {
		display: "block",
		paddingBottom: "20px",
		borderBottom: "1px solid",
		borderColor: colors.border,
		fontSize: "20px",
		fontWeight: 500,
		fontVariantNumeric: "tabular-nums",
	},
	description: { fontSize: "14px", lineHeight: 1.7, marginTop: "20px" },
	note: {
		fontSize: "12px",
		lineHeight: 1.6,
		color: colors.mutedForeground,
		marginBlock: "18px",
	},
	links: {
		display: "flex",
		alignItems: "center",
		gap: "16px",
		flexWrap: "wrap",
	},
	details: {
		display: "inline-flex",
		alignItems: "center",
		minHeight: "44px",
		padding: "8px 14px",
		border: "1px solid",
		borderColor: colors.border,
		borderRadius: "4px",
		fontSize: "13px",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
	},
	tax: {
		fontSize: "10px",
		fontWeight: 400,
		color: colors.mutedForeground,
		marginInlineStart: "6px",
	},
});
