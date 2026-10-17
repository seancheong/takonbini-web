import * as stylex from "@stylexjs/stylex";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProxiedImageUrl } from "@/features/products/model/product-images";
import { isSafari } from "@/features/products/model/product-navigation";
import type {
	ActiveCatalogProduct,
	ProductFilters,
} from "@/features/products/products.contracts";
import type { Language } from "@/i18n";
import { storeTextStyles } from "@/styles/stores.stylex";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
import {
	formatPrice,
	isFutureReleaseDate,
	resolveLocalizedText,
} from "../model/product-display";
import {
	type CategoryLabelKey,
	categoryLabelKeys,
	type StoreLabelKey,
	storeLabelKeys,
} from "../model/product-labels";

interface ProductCardProps {
	product: ActiveCatalogProduct;
	filters?: ProductFilters;
	onPreview?: (product: ActiveCatalogProduct) => void;
}
export default function ProductCard({
	product,
	filters,
	onPreview,
}: ProductCardProps) {
	const { t, i18n } = useTranslation();
	const language = i18n.language as Language;
	const navigate = useNavigate();
	const router = useRouter();
	const [imageError, setImageError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [isSafariNavigating, setIsSafariNavigating] = useState(false);
	const imageRef = useRef<HTMLImageElement | null>(null);
	const image = product.images[0];
	const imageSrc = image ? getProxiedImageUrl(image) : undefined;
	const title = resolveLocalizedText(product.title, language);
	const storeLabelKey =
		storeLabelKeys[product.store as keyof typeof storeLabelKeys];
	const categoryLabelKey =
		product.category &&
		categoryLabelKeys[product.category as keyof typeof categoryLabelKeys];
	const showLoading = Boolean(imageSrc && !imageError && !imageLoaded);
	const isReleaseSoon = isFutureReleaseDate(product.releaseDate);
	const viewTransitionName = `product-image-${product.id}`;
	useEffect(() => {
		setImageError(false);
		setImageLoaded(false);
	}, []);
	useEffect(() => {
		if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
			setImageLoaded(true);
		}
	}, []);
	return (
		<Link
			to="/products/$id"
			params={{
				id: product.id,
			}}
			search={filters}
			aria-label={title}
			preload="intent"
			onClick={(event) => {
				if (
					event.button !== 0 ||
					event.metaKey ||
					event.ctrlKey ||
					event.shiftKey ||
					event.altKey
				)
					return;
				event.preventDefault();
				if (onPreview) {
					onPreview(product);
					return;
				}
				if (isSafari()) {
					setIsSafariNavigating(true);
					const unsubscribe = router.subscribe("onResolved", () => {
						unsubscribe();
						setIsSafariNavigating(false);
					});
				}
				const viewTransition =
					typeof document.startViewTransition === "function" &&
					!isSafari() &&
					!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
				navigate({
					to: "/products/$id",
					params: {
						id: product.id,
					},
					...(filters
						? {
								search: filters,
							}
						: {}),
					...(viewTransition
						? {
								viewTransition: true,
							}
						: {}),
				});
			}}
			data-store={product.store}
			{...stylex.props(layoutStyles.card)}
		>
			<article {...stylex.props(layoutStyles.article)}>
				<div {...stylex.props(layoutStyles.imageCanvas)}>
					{isSafari() && isSafariNavigating ? (
						<div {...stylex.props(layoutStyles.safariOverlay)}>
							<span {...stylex.props(layoutStyles.spinner)} />
							{t("product.loading")}
						</div>
					) : null}
					{showLoading ? (
						<div {...stylex.props(layoutStyles.loadingOverlay)}>
							{t("product.imageLoading")}
						</div>
					) : null}
					{imageSrc && !imageError ? (
						<img
							ref={imageRef}
							src={imageSrc}
							alt={title}
							style={
								isSafari()
									? undefined
									: {
											viewTransitionName,
										}
							}
							onError={() => setImageError(true)}
							onLoad={() => setImageLoaded(true)}
							decoding="async"
							loading="lazy"
							{...stylex.props(
								layoutStyles.image,
								imageLoaded ? layoutStyles.visible : layoutStyles.hidden,
							)}
						/>
					) : (
						<div {...stylex.props(layoutStyles.imageFallback)}>
							<span>{t("product.noImage")}</span>
						</div>
					)}

					{isReleaseSoon ? (
						<span {...stylex.props(layoutStyles.upcomingBadge)}>
							{t("product.releaseSoon")}
						</span>
					) : product.isNew ? (
						<span {...stylex.props(layoutStyles.newBadge)}>
							{t("product.new")}
						</span>
					) : null}
				</div>

				<div {...stylex.props(layoutStyles.copy)}>
					<div {...stylex.props(layoutStyles.storeRow)}>
						<span
							{...stylex.props(
								layoutStyles.storeLabel,
								storeTextStyles[product.store],
							)}
						>
							{storeLabelKey
								? t(storeLabelKey as StoreLabelKey)
								: product.store}
						</span>
					</div>

					<div {...stylex.props(layoutStyles.titleRow)}>
						<h2 {...stylex.props(layoutStyles.title)}>{title}</h2>
						{language !== "ja" && title !== product.title.ja && (
							<p lang="ja" {...stylex.props(layoutStyles.japanese)}>
								{product.title.ja}
							</p>
						)}
					</div>

					<div {...stylex.props(layoutStyles.metadata)}>
						{product.category ? (
							<span {...stylex.props(layoutStyles.category)}>
								{categoryLabelKey
									? t(categoryLabelKey as CategoryLabelKey)
									: product.category}
							</span>
						) : (
							<span />
						)}
						<span {...stylex.props(layoutStyles.price)}>
							{product.price === 0
								? t("product.priceUnknown")
								: formatPrice(product.price, language)}
							{product.price > 0 && (
								<small {...stylex.props(layoutStyles.tax)}>
									{t("product.taxIncluded")}
								</small>
							)}
						</span>
					</div>
				</div>
			</article>
		</Link>
	);
}
const spin = stylex.keyframes({
	to: {
		transform: "rotate(360deg)",
	},
});
const layoutStyles = stylex.create({
	japanese: {
		fontSize: "11px",
		lineHeight: 1.6,
		color: colors.mutedForeground,
		marginTop: "6px",
		marginBottom: "8px",
	},
	tax: {
		fontSize: "10px",
		fontWeight: 400,
		color: colors.mutedForeground,
		marginInlineStart: "6px",
		whiteSpace: "nowrap",
	},
	card: {
		display: "block",
		height: "100%",
		backgroundColor: "transparent",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
	},
	article: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflow: "hidden",
	},
	imageCanvas: {
		position: "relative",
		aspectRatio: { default: "1.15", [conditions.compactCatalog]: "1" },
		overflow: "hidden",
		backgroundColor: colors.imageCanvas,
		borderRadius: "3px",
		border: "1px solid",
		borderColor: colors.border,
	},
	safariOverlay: {
		position: "absolute",
		top: "0px",
		right: "0px",
		bottom: "0px",
		left: "0px",
		zIndex: 10,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.imageCanvas,
		fontSize: "0.75rem",
		lineHeight: "1rem",
		fontWeight: 600,
		color: colors.imagePlaceholder,
		backdropFilter: "blur(8px)",
	},
	spinner: {
		marginRight: "0.5rem",
		height: "0.75rem",
		width: "0.75rem",
		animationName: {
			default: spin,
			[conditions.reducedMotion]: "none",
		},
		animationDuration: "1s",
		animationTimingFunction: "linear",
		animationIterationCount: "infinite",
		borderRadius: "9999px",
		borderTopWidth: "2px",
		borderRightWidth: "2px",
		borderBottomWidth: "2px",
		borderLeftWidth: "2px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: "transparent",
		borderRightColor: "color-mix(in oklab, var(--foreground) 60%, transparent)",
		borderBottomColor:
			"color-mix(in oklab, var(--foreground) 60%, transparent)",
		borderLeftColor: "color-mix(in oklab, var(--foreground) 60%, transparent)",
		transitionProperty: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
	loadingOverlay: {
		position: "absolute",
		top: "0px",
		right: "0px",
		bottom: "0px",
		left: "0px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.imageCanvas,
		fontSize: "0.75rem",
		lineHeight: "1rem",
		fontWeight: 600,
		color: colors.imagePlaceholder,
	},
	visible: {
		opacity: 1,
	},
	hidden: {
		opacity: 0,
	},
	image: {
		height: "100%",
		width: "100%",
		objectFit: "contain",
		paddingTop: "1rem",
		paddingRight: "1rem",
		paddingBottom: "1rem",
		paddingLeft: "1rem",
	},
	imageFallback: {
		display: "flex",
		height: "100%",
		width: "100%",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: "0.5rem",
		paddingLeft: "1rem",
		paddingRight: "1rem",
		textAlign: "center",
		fontSize: "0.75rem",
		lineHeight: "1rem",
		color: colors.imagePlaceholder,
		backgroundColor: colors.imageCanvas,
	},
	upcomingBadge: {
		position: "absolute",
		left: "0.75rem",
		top: "0.75rem",
		borderRadius: "9999px",
		backgroundColor: colors.destructive,
		paddingLeft: "0.5rem",
		paddingRight: "0.5rem",
		paddingTop: "0.25rem",
		paddingBottom: "0.25rem",
		fontSize: "0.75rem",
		lineHeight: "1rem",
		fontWeight: 600,
		color: colors.successForeground,
	},
	newBadge: {
		position: "absolute",
		left: "0.75rem",
		top: "0.75rem",
		borderRadius: "9999px",
		backgroundColor: colors.success,
		paddingLeft: "0.5rem",
		paddingRight: "0.5rem",
		paddingTop: "0.25rem",
		paddingBottom: "0.25rem",
		fontSize: "0.75rem",
		lineHeight: "1rem",
		fontWeight: 600,
		color: colors.successForeground,
	},
	copy: {
		display: "flex",
		flex: 1,
		flexDirection: "column",
		gap: "10px",
		paddingTop: "17px",
	},
	storeRow: {
		display: "flex",
		flexWrap: {
			default: "wrap",
			":last-child": "wrap",
		},
		alignItems: "center",
		gap: "0.5rem",
		fontSize: "0.75rem",
		lineHeight: "1rem",
	},
	storeLabel: {
		fontSize: "10px",
		letterSpacing: ".08em",
		textTransform: "uppercase",
		fontWeight: 600,
	},
	titleRow: {
		flex: 1,
		flexWrap: {
			default: null,
			":last-child": "wrap",
		},
	},
	title: {
		fontSize: { default: "17px", [conditions.compactCatalog]: "15px" },
		lineHeight: 1.4,
		fontWeight: 500,
		color: colors.foreground,
		textWrap: "pretty",
		overflowWrap: "anywhere",
	},
	metadata: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "0.75rem",
		flexWrap: {
			default: null,
			":last-child": "wrap",
		},
	},
	category: {
		fontSize: "0.75rem",
		lineHeight: "1rem",
		color: colors.mutedForeground,
	},
	price: {
		fontSize: "14px",
		fontWeight: 500,
		fontVariantNumeric: "tabular-nums",
		color: colors.foreground,
	},
});
