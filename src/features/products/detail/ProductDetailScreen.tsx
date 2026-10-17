import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import "../model/catalog-navigation";
import { Link, useRouter } from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	ExternalLink,
	JapaneseYen,
	MapPin,
	Tag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { productByIdQueryOptions } from "@/features/products/data/product-queries";
import {
	formatPrice,
	isFutureReleaseDate,
	resolveLocalizedText,
} from "@/features/products/model/product-display";
import { getProxiedImageUrl } from "@/features/products/model/product-images";
import {
	type CategoryLabelKey,
	categoryLabelKeys,
	type RegionLabelKey,
	regionLabelKeys,
	type StoreLabelKey,
	storeLabelKeys,
} from "@/features/products/model/product-labels";
import { isSafari } from "@/features/products/model/product-navigation";
import type { Language } from "@/i18n";
import { storeTextStyles } from "@/styles/stores.stylex";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
import type { ProductFilters } from "../products.contracts";
export default function ProductDetailScreen({
	id,
	filters,
	presentation = "page",
}: {
	id: string;
	filters: ProductFilters;
	presentation?: "page" | "modal";
}) {
	const router = useRouter();
	const [imageError, setImageError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const imageRef = useRef<HTMLImageElement | null>(null);
	const { t, i18n } = useTranslation();
	const language = i18n.language as Language;
	const { data: product } = useSuspenseQuery(productByIdQueryOptions(id));
	const image = product.images?.[0];
	const imageSrc = image ? getProxiedImageUrl(image) : undefined;
	const showLoading = Boolean(imageSrc && !imageError && !imageLoaded);
	const isReleaseSoon = isFutureReleaseDate(product.releaseDate);
	const viewTransitionName = `product-image-${id}`;
	useEffect(() => {
		setImageError(false);
		setImageLoaded(false);
	}, []);
	useEffect(() => {
		if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
			setImageLoaded(true);
		}
	}, []);
	const title = resolveLocalizedText(product.title, language);
	const description = resolveLocalizedText(product.description, language);
	const storeLabelKey =
		storeLabelKeys[product.store as keyof typeof storeLabelKeys];
	const categoryLabelKey =
		product.category &&
		categoryLabelKeys[product.category as keyof typeof categoryLabelKeys];
	const regionLabels = (product.regions ?? []).map((region) => {
		const regionKey = regionLabelKeys[region as keyof typeof regionLabelKeys];
		return regionKey ? t(regionKey as RegionLabelKey) : region;
	});
	const extraImages = product.images.slice(1).map((item) => ({
		original: item,
		proxy: getProxiedImageUrl(item),
	}));
	return (
		<div
			{...stylex.props(
				layoutStyles.screen,
				presentation === "modal" && layoutStyles.modalScreen,
			)}
		>
			<div {...stylex.props(layoutStyles.container)}>
				{presentation === "page" && (
					<Link
						to="/"
						search={filters}
						onClick={(event) => {
							if (
								event.button !== 0 ||
								event.metaKey ||
								event.ctrlKey ||
								event.shiftKey ||
								event.altKey ||
								!router.state.location.state.fromCatalog ||
								!router.history.canGoBack()
							)
								return;
							event.preventDefault();
							const y = router.state.location.state.catalogScrollY;
							const unsubscribe = router.subscribe("onRendered", () => {
								unsubscribe();
								if (y !== undefined)
									window.scrollTo({ top: y, behavior: "instant" });
							});
							router.history.back();
						}}
						{...stylex.props(layoutStyles.back)}
					>
						<ArrowLeft
							aria-hidden="true"
							{...stylex.props(layoutStyles.icon)}
						/>
						{t("product.details.back")}
					</Link>
				)}

				<div {...stylex.props(layoutStyles.columns)}>
					<div>
						<div {...stylex.props(layoutStyles.imageCanvas)}>
							{showLoading ? (
								<div {...stylex.props(layoutStyles.imageLoading)}>
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
									fetchPriority="high"
									loading="eager"
									decoding="async"
									onError={() => setImageError(true)}
									onLoad={() => setImageLoaded(true)}
									{...stylex.props(
										layoutStyles.image,
										layoutStyles.primaryImage,
										imageLoaded ? layoutStyles.visible : layoutStyles.hidden,
									)}
								/>
							) : (
								<div {...stylex.props(layoutStyles.imageFallback)}>
									<span>{t("product.noImage")}</span>
									{imageError ? (
										<span {...stylex.props(layoutStyles.imageError)}>
											{t("product.unavailable")}
										</span>
									) : null}
								</div>
							)}
						</div>

						{extraImages.length ? (
							<div {...stylex.props(layoutStyles.gallery)}>
								{extraImages.map((item) => (
									<div
										key={item.original}
										{...stylex.props(layoutStyles.thumbnail)}
									>
										<img
											src={item.proxy}
											alt={title}
											loading="lazy"
											{...stylex.props(layoutStyles.image)}
										/>
									</div>
								))}
							</div>
						) : null}
					</div>

					<div {...stylex.props(layoutStyles.copy)}>
						<div>
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

							<h1 {...stylex.props(layoutStyles.title)}>{title}</h1>

							{description ? (
								<p {...stylex.props(layoutStyles.description)}>{description}</p>
							) : null}
						</div>

						<div {...stylex.props(layoutStyles.factsCard)}>
							<dl {...stylex.props(layoutStyles.facts)}>
								<dt {...stylex.props(layoutStyles.label)}>
									<JapaneseYen
										aria-hidden="true"
										{...stylex.props(layoutStyles.icon)}
									/>
									{t("product.details.price")}
								</dt>
								<dd {...stylex.props(layoutStyles.value)}>
									{product.price === 0
										? t("product.priceUnknown")
										: formatPrice(product.price, language)}
									{product.price > 0 && (
										<small {...stylex.props(layoutStyles.tax)}>
											{t("product.taxIncluded")}
										</small>
									)}
								</dd>

								{product.category ? (
									<>
										<dt {...stylex.props(layoutStyles.label)}>
											<Tag
												aria-hidden="true"
												{...stylex.props(layoutStyles.icon)}
											/>
											{t("product.details.category")}
										</dt>
										<dd {...stylex.props(layoutStyles.factValue)}>
											{categoryLabelKey
												? t(categoryLabelKey as CategoryLabelKey)
												: product.category}
										</dd>
									</>
								) : null}

								{product.releaseDate ? (
									<>
										<dt {...stylex.props(layoutStyles.label)}>
											<Calendar
												aria-hidden="true"
												{...stylex.props(layoutStyles.icon)}
											/>
											{t("product.details.releaseDate")}
										</dt>
										<dd {...stylex.props(layoutStyles.factValue)}>
											{product.releaseDate}
										</dd>
									</>
								) : null}

								{regionLabels.length ? (
									<>
										<dt {...stylex.props(layoutStyles.regionLabel)}>
											<MapPin
												aria-hidden="true"
												{...stylex.props(layoutStyles.regionIcon)}
											/>
											<span {...stylex.props(layoutStyles.regionTitle)}>
												{t("product.details.regions")}
											</span>
										</dt>
										<dd {...stylex.props(layoutStyles.regions)}>
											{regionLabels.join(", ")}
										</dd>
									</>
								) : null}
							</dl>
						</div>

						<p {...stylex.props(layoutStyles.availability)}>
							{t("product.availabilityNote")}
						</p>

						<a
							href={product.url}
							target="_blank"
							rel="noreferrer"
							{...stylex.props(layoutStyles.sourceLink)}
						>
							{t("product.details.source")}
							<ExternalLink
								aria-hidden="true"
								{...stylex.props(layoutStyles.icon)}
							/>
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
const layoutStyles = stylex.create({
	modalScreen: { minHeight: 0, padding: "32px", paddingTop: "52px" },
	tax: {
		fontSize: "10px",
		fontWeight: 400,
		color: colors.mutedForeground,
		marginInlineStart: "6px",
	},
	screen: {
		minHeight: "100vh",
		backgroundColor: colors.background,
		paddingLeft: "1rem",
		paddingRight: "1rem",
		paddingBottom: "4rem",
		paddingTop: "40px",
	},
	container: {
		marginLeft: "auto",
		marginRight: "auto",
		width: "100%",
		maxWidth: "72rem",
	},
	back: {
		display: "inline-flex",
		alignItems: "center",
		gap: "0.5rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		fontWeight: 600,
		color: {
			default: colors.mutedForeground,
			":hover": colors.foreground,
		},
		cursor: "pointer",
	},
	icon: {
		height: "1rem",
		width: "1rem",
	},
	columns: {
		marginTop: "1.5rem",
		display: "grid",
		gap: "2rem",
		gridTemplateColumns: {
			default: null,
			[conditions.detailColumns]: "minmax(0,1.2fr) minmax(0,0.8fr)",
		},
	},
	imageCanvas: {
		position: "relative",
		aspectRatio: "1",
		width: "100%",
		overflow: "hidden",
		borderRadius: "calc(var(--radius) - 2px)",
		borderTopWidth: "1px",
		borderRightWidth: "1px",
		borderBottomWidth: "1px",
		borderLeftWidth: "1px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderRightColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderBottomColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderLeftColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		backgroundColor: colors.imageCanvas,
		marginBottom: {
			default: null,
			":not(:last-child)": "1rem",
		},
	},
	imageLoading: {
		position: "absolute",
		top: "0px",
		right: "0px",
		bottom: "0px",
		left: "0px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "color-mix(in oklab, var(--muted) 40%, transparent)",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		fontWeight: 600,
		color: colors.mutedForeground,
	},
	visible: {
		opacity: 1,
	},
	hidden: {
		opacity: 0,
	},
	primaryImage: { position: "absolute", inset: 0 },
	image: {
		height: "100%",
		width: "100%",
		objectFit: "contain",
		paddingTop: "1.5rem",
		paddingRight: "1.5rem",
		paddingBottom: "1.5rem",
		paddingLeft: "1.5rem",
	},
	imageFallback: {
		position: "absolute",
		inset: 0,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: "0.5rem",
		paddingLeft: "1rem",
		paddingRight: "1rem",
		textAlign: "center",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		color: colors.mutedForeground,
	},
	imageError: {
		fontSize: "0.75rem",
		lineHeight: "1rem",
		fontWeight: 500,
	},
	gallery: {
		display: "grid",
		gridTemplateColumns: {
			default: "repeat(3, minmax(0, 1fr))",
			[conditions.shellLabels]: "repeat(4, minmax(0, 1fr))",
		},
		gap: "0.75rem",
		marginBottom: {
			default: null,
			":not(:last-child)": "1rem",
		},
	},
	thumbnail: {
		aspectRatio: "1",
		overflow: "hidden",
		borderRadius: "calc(var(--radius) + 4px)",
		borderTopWidth: "1px",
		borderRightWidth: "1px",
		borderBottomWidth: "1px",
		borderLeftWidth: "1px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderRightColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderBottomColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderLeftColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		backgroundColor: colors.muted,
	},
	copy: {
		display: "flex",
		flexDirection: "column",
		gap: "1.5rem",
	},
	storeRow: {
		display: "flex",
		alignItems: "center",
		gap: "0.75rem",
	},
	storeLabel: {
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		fontWeight: 600,
	},
	upcomingBadge: {
		borderRadius: "9999px",
		backgroundColor: colors.upcomingBadgeBackground,
		paddingLeft: "0.5rem",
		paddingRight: "0.5rem",
		paddingTop: "0.25rem",
		paddingBottom: "0.25rem",
		fontSize: "0.75rem",
		lineHeight: "1rem",
		fontWeight: 600,
		color: colors.upcomingBadgeForeground,
	},
	newBadge: {
		borderRadius: "9999px",
		backgroundColor: colors.newBadgeBackground,
		paddingLeft: "0.5rem",
		paddingRight: "0.5rem",
		paddingTop: "0.25rem",
		paddingBottom: "0.25rem",
		fontSize: "0.75rem",
		lineHeight: "1rem",
		fontWeight: 600,
		color: colors.newBadgeForeground,
	},
	title: {
		marginTop: "0.75rem",
		fontSize: "1.875rem",
		lineHeight: 1.25,
		fontWeight: 600,
		color: colors.foreground,
	},
	description: {
		marginTop: "1rem",
		maxWidth: "65ch",
		fontSize: "1rem",
		lineHeight: 1.625,
		color: colors.mutedForeground,
	},
	factsCard: {
		borderRadius: "calc(var(--radius) - 2px)",
		borderTopWidth: "1px",
		borderRightWidth: "1px",
		borderBottomWidth: "1px",
		borderLeftWidth: "1px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderRightColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderBottomColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderLeftColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		backgroundColor: colors.card,
		paddingTop: "1.25rem",
		paddingRight: "1.25rem",
		paddingBottom: "1.25rem",
		paddingLeft: "1.25rem",
	},
	facts: {
		display: "grid",
		gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
		alignItems: "center",
		columnGap: "1.5rem",
		rowGap: "1rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
	},
	label: {
		display: "flex",
		alignItems: "center",
		gap: "0.75rem",
		color: colors.mutedForeground,
	},
	value: {
		minWidth: "0px",
		textAlign: "right",
		fontSize: "1rem",
		lineHeight: "1.5rem",
		fontWeight: 600,
		color: colors.foreground,
	},
	factValue: {
		minWidth: "0px",
		textAlign: "right",
		color: colors.foreground,
	},
	regionLabel: {
		display: "flex",
		alignItems: "flex-start",
		gap: "0.75rem",
		color: colors.mutedForeground,
	},
	regionIcon: {
		marginTop: "0.125rem",
		height: "1rem",
		width: "1rem",
	},
	regionTitle: {
		whiteSpace: "nowrap",
	},
	regions: {
		minWidth: "0px",
		textAlign: "right",
		color: colors.foreground,
		overflowWrap: "break-word",
		whiteSpace: "normal",
	},
	availability: {
		fontSize: "0.875rem",
		lineHeight: 1.625,
		color: colors.mutedForeground,
	},
	sourceLink: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "flex-end",
		gap: "0.5rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		fontWeight: 600,
		color: colors.link,
		textDecorationLine: {
			default: null,
			":hover": "underline",
		},
	},
});
