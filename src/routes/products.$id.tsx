import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	ExternalLink,
	JapaneseYen,
	MapPin,
	Tag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	type CategoryLabelKey,
	categoryLabelKeys,
	type RegionLabelKey,
	regionLabelKeys,
	type StoreLabelKey,
	storeLabelClasses,
	storeLabelKeys,
} from "@/features/product/utils/productLabels";
import {
	formatPrice,
	resolveLocalizedText,
} from "@/features/product/utils/productUtils";
import type { Language } from "@/i18n";
import { productsQueryOptions } from "@/services/productService";

export const Route = createFileRoute("/products/$id")({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(productsQueryOptions());
	},
	component: ProductDetails,
});

function ProductDetails() {
	const { id } = Route.useParams();
	const router = useRouter();

	const { t, i18n } = useTranslation();
	const language = i18n.language as Language;

	const { data, isLoading, isError } = useQuery(productsQueryOptions());
	const products = data?.products ?? [];
	const product = products.find((item) => item.id === id);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background px-4 pb-16 pt-24">
				<div className="mx-auto w-full max-w-6xl">
					<div className="h-5 w-32 animate-pulse rounded-full bg-muted" />
					<div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
						<div className="aspect-4/3 w-full animate-pulse rounded-2xl border border-border/60 bg-muted/40" />
						<div className="space-y-4">
							<div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
							<div className="h-20 w-full animate-pulse rounded bg-muted" />
							<div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (isError || !product) {
		return (
			<div className="min-h-screen bg-background px-4 pb-16 pt-24">
				<div className="mx-auto w-full max-w-3xl">
					<h1 className="text-2xl font-semibold text-foreground">
						{t("product.details.notFoundTitle")}
					</h1>

					<p className="mt-2 text-sm text-muted-foreground">
						{t("product.details.notFoundBody")}
					</p>

					<button
						type="button"
						onClick={() => router.history.go(-1)}
						className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
					>
						<ArrowLeft className="h-4 w-4" aria-hidden="true" />
						{t("product.details.back")}
					</button>
				</div>
			</div>
		);
	}

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

	const image = product.images[0];
	const extraImages = product.images.slice(1);

	return (
		<div className="min-h-screen bg-background px-4 pb-16 pt-24">
			<div className="mx-auto w-full max-w-6xl">
				<button
					type="button"
					onClick={() => router.history.go(-1)}
					className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden="true" />
					{t("product.details.back")}
				</button>

				<div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
					<div className="space-y-4">
						<div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted">
							{image ? (
								<img
									src={image}
									alt={title}
									className="h-full w-full object-cover"
								/>
							) : (
								<div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
									{t("product.noImage")}
								</div>
							)}
						</div>

						{extraImages.length ? (
							<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
								{extraImages.map((item) => (
									<div
										key={item}
										className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted"
									>
										<img
											src={item}
											alt={title}
											className="h-full w-full object-cover"
											loading="lazy"
										/>
									</div>
								))}
							</div>
						) : null}
					</div>

					<div className="flex flex-col gap-6">
						<div>
							<div className="flex items-center gap-3">
								<span
									className={`text-sm font-semibold ${
										storeLabelClasses[product.store] ?? "text-foreground"
									}`}
								>
									{storeLabelKey
										? t(storeLabelKey as StoreLabelKey)
										: product.store}
								</span>
								{product.isNew ? (
									<span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
										{t("product.new")}
									</span>
								) : null}
							</div>

							<h1 className="mt-3 text-3xl font-semibold text-foreground">
								{title}
							</h1>

							{description ? (
								<p className="mt-4 text-base text-muted-foreground">
									{description}
								</p>
							) : null}
						</div>

						<div className="rounded-2xl border border-border/60 bg-muted/10 p-5">
							<dl className="space-y-4 text-sm">
								<div className="flex items-center justify-between gap-6">
									<div className="flex items-center gap-3 text-muted-foreground">
										<JapaneseYen className="h-4 w-4" aria-hidden="true" />
										<dt>{t("product.details.price")}</dt>
									</div>
									<dd className="text-base font-semibold text-foreground">
										{formatPrice(product.price, language)}
									</dd>
								</div>

								{product.category ? (
									<div className="flex items-center justify-between gap-6">
										<div className="flex items-center gap-3 text-muted-foreground">
											<Tag className="h-4 w-4" aria-hidden="true" />
											<dt>{t("product.details.category")}</dt>
										</div>
										<dd className="text-foreground">
											{categoryLabelKey
												? t(categoryLabelKey as CategoryLabelKey)
												: product.category}
										</dd>
									</div>
								) : null}

								{product.releaseDate ? (
									<div className="flex items-center justify-between gap-6">
										<div className="flex items-center gap-3 text-muted-foreground">
											<Calendar className="h-4 w-4" aria-hidden="true" />
											<dt>{t("product.details.releaseDate")}</dt>
										</div>
										<dd className="text-foreground">{product.releaseDate}</dd>
									</div>
								) : null}

								{regionLabels.length ? (
									<div className="flex items-start justify-between gap-6">
										<div className="flex items-start gap-3 text-muted-foreground">
											<MapPin className="mt-0.5 h-4 w-4" aria-hidden="true" />
											<dt className="whitespace-nowrap">
												{t("product.details.regions")}
											</dt>
										</div>
										<dd className="text-right text-foreground">
											{regionLabels.join(", ")}
										</dd>
									</div>
								) : null}
							</dl>
						</div>

						<a
							href={product.url}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center justify-end gap-2 text-sm font-semibold text-primary hover:underline"
						>
							{t("product.details.source")}
							<ExternalLink className="h-4 w-4" aria-hidden="true" />
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
