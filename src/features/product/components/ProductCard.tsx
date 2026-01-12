import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PublicProduct } from "@/@types/product";
import type { Language } from "@/i18n";
import { getProxiedImageUrl } from "@/utils/imageProxy";
import {
	type CategoryLabelKey,
	categoryLabelKeys,
	type StoreLabelKey,
	storeLabelClasses,
	storeLabelKeys,
} from "../utils/productLabels";
import { formatPrice, resolveLocalizedText } from "../utils/productUtils";

interface ProductCardProps {
	product: PublicProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
	const { t, i18n } = useTranslation();
	const language = i18n.language as Language;
	const [imageError, setImageError] = useState(false);

	const image = product.images[0];
	const imageSrc = image ? getProxiedImageUrl(image) : undefined;
	const title = resolveLocalizedText(product.title, language);
	const storeLabelKey =
		storeLabelKeys[product.store as keyof typeof storeLabelKeys];
	const categoryLabelKey =
		product.category &&
		categoryLabelKeys[product.category as keyof typeof categoryLabelKeys];

	const isUnavailable = Boolean(imageSrc && imageError);

	return (
		<Link
			to="/products/$id"
			params={{ id: product.id }}
			aria-label={title}
			className={`group block h-full rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow duration-200 hover:border-border hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
				isUnavailable ? "opacity-75" : ""
			}`}
		>
			<article className="flex h-full flex-col overflow-hidden rounded-2xl">
				<div className="relative aspect-4/3 w-full overflow-hidden border-b border-border/60 bg-muted">
					{imageSrc && !imageError ? (
						<img
							src={imageSrc}
							alt={title}
							onError={() => setImageError(true)}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							loading="lazy"
						/>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-xs text-muted-foreground">
							<span>{t("product.noImage")}</span>

							{imageError ? (
								<span className="text-[11px] font-medium">
									{t("product.unavailable")}
								</span>
							) : null}
						</div>
					)}

					{product.isNew ? (
						<span className="absolute left-3 top-3 rounded-full bg-(--success) px-2 py-1 text-xs font-semibold text-(--success-foreground)">
							{t("product.new")}
						</span>
					) : null}
				</div>

				<div className="flex flex-1 flex-col gap-3 p-4">
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
						<h2 className="text-base font-semibold text-foreground">{title}</h2>
					</div>

					<div className="flex items-center justify-between gap-3">
						{product.category ? (
							<span className="rounded-full border border-foreground/15 bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground">
								{categoryLabelKey
									? t(categoryLabelKey as CategoryLabelKey)
									: product.category}
							</span>
						) : (
							<span />
						)}
						<span className="text-sm font-semibold text-foreground">
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
