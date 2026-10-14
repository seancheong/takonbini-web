import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProductFilters } from "@/features/products/data/product-queries";
import { getProxiedImageUrl } from "@/features/products/model/product-images";
import { isSafari } from "@/features/products/model/product-navigation";
import type { PublicProduct } from "@/features/products/products.contracts";
import type { Language } from "@/i18n";
import {
	formatPrice,
	isFutureReleaseDate,
	resolveLocalizedText,
} from "../model/product-display";
import {
	type CategoryLabelKey,
	categoryLabelKeys,
	type StoreLabelKey,
	storeLabelClasses,
	storeLabelKeys,
} from "../model/product-labels";

interface ProductCardProps {
	product: PublicProduct;
	filters?: ProductFilters;
}

export default function ProductCard({ product, filters }: ProductCardProps) {
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

	const startViewTransition = (
		callback: () => void,
		event: React.MouseEvent,
	) => {
		const transition = (
			document as Document & {
				startViewTransition?: (callback: () => Promise<void>) => void;
			}
		).startViewTransition;

		if (
			!transition ||
			isSafari() ||
			window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
		) {
			if (isSafari()) {
				setIsSafariNavigating(true);

				const unsub = router.subscribe("onResolved", () => {
					unsub();
					setIsSafariNavigating(false);
				});
			}
			callback();

			return;
		}

		event.preventDefault();
		transition.call(
			document,
			() =>
				new Promise<void>((resolve) => {
					const unsub = router.subscribe("onResolved", () => {
						unsub();
						resolve();
					});

					callback();
				}),
		);
	};

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
			params={{ id: product.id }}
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
				startViewTransition(
					() =>
						navigate({
							to: "/products/$id",
							params: { id: product.id },
							...(filters ? { search: filters } : {}),
						}),
					event,
				);
			}}
			data-store={product.store}
			className="catalog-product group"
		>
			<article className="flex h-full flex-col overflow-hidden">
				<div className="catalog-product-image relative">
					{isSafari() && isSafariNavigating ? (
						<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 text-xs font-semibold text-foreground backdrop-blur-sm">
							<span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-foreground/60 border-t-transparent" />
							{t("product.loading")}
						</div>
					) : null}
					{showLoading ? (
						<div className="absolute inset-0 flex items-center justify-center bg-muted/40 text-xs font-semibold text-muted-foreground">
							{t("product.imageLoading")}
						</div>
					) : null}
					{imageSrc && !imageError ? (
						<img
							ref={imageRef}
							src={imageSrc}
							alt={title}
							style={isSafari() ? undefined : { viewTransitionName }}
							onError={() => setImageError(true)}
							onLoad={() => setImageLoaded(true)}
							className={`h-full w-full object-contain p-4 ${
								imageLoaded ? "opacity-100" : "opacity-0"
							}`}
							decoding="async"
							loading="lazy"
						/>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-muted-foreground">
							<span>{t("product.noImage")}</span>
						</div>
					)}

					{isReleaseSoon ? (
						<span className="absolute left-3 top-3 rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-(--success-foreground)">
							{t("product.releaseSoon")}
						</span>
					) : product.isNew ? (
						<span className="absolute left-3 top-3 rounded-full bg-(--success) px-2 py-1 text-xs font-semibold text-(--success-foreground)">
							{t("product.new")}
						</span>
					) : null}
				</div>

				<div className="catalog-product-copy">
					<div className="flex flex-wrap items-center gap-2 text-xs">
						<span
							className={`text-sm font-semibold ${
								storeLabelClasses[product.store] ?? "text-foreground"
							}`}
						>
							{storeLabelKey
								? t(storeLabelKey as StoreLabelKey)
								: product.store}
						</span>
					</div>

					<div className="flex-1">
						<h2 className="text-base font-semibold leading-snug text-foreground">
							{title}
						</h2>
					</div>

					<div className="flex items-center justify-between gap-3">
						{product.category ? (
							<span className="text-xs text-muted-foreground">
								{categoryLabelKey
									? t(categoryLabelKey as CategoryLabelKey)
									: product.category}
							</span>
						) : (
							<span />
						)}
						<span className="text-base font-semibold tabular-nums text-foreground">
							{product.price === 0
								? t("product.priceUnknown")
								: formatPrice(product.price, language)}
						</span>
					</div>
				</div>
			</article>
		</Link>
	);
}
