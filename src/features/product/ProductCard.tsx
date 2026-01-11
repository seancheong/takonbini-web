import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { PublicProduct } from "@/@types/product";
import type { Language } from "@/i18n";

type LocalizedText = PublicProduct["title"] | PublicProduct["description"];

const resolveLocalizedText = (
	localizedText: LocalizedText,
	language: Language,
) => localizedText[language] || localizedText.en || localizedText.ja || "";

const resolveCurrencyLocale = (language: Language) => {
	if (language === "ja") return "ja-JP";
	if (language === "zh") return "zh-TW";

	return "en-US";
};

const formatPrice = (price: number, language: Language) =>
	new Intl.NumberFormat(resolveCurrencyLocale(language), {
		style: "currency",
		currency: "JPY",
		maximumFractionDigits: 0,
	}).format(price);

interface ProductCardProps {
	product: PublicProduct;
}

const storeLabelClasses: Record<string, string> = {
	SevenEleven: "text-orange-700 dark:text-orange-400",
	Lawson: "text-blue-700 dark:text-blue-400",
	FamilyMart: "text-emerald-700 dark:text-emerald-400",
};

const storeLabelKeys = {
	SevenEleven: "product.store.sevenEleven",
	Lawson: "product.store.lawson",
	FamilyMart: "product.store.familyMart",
} as const;

type StoreLabelKey = (typeof storeLabelKeys)[keyof typeof storeLabelKeys];

const categoryLabelKeys = {
	Onigiri: "product.category.onigiri",
	Bento: "product.category.bento",
	Sushi: "product.category.sushi",
	Sandwich: "product.category.sandwich",
	Bread: "product.category.bread",
	Noodle: "product.category.noodle",
	Pasta: "product.category.pasta",
	Salad: "product.category.salad",
	SideDish: "product.category.sideDish",
	FriedFood: "product.category.friedFood",
	SteamedBun: "product.category.steamedBun",
	Oden: "product.category.oden",
	Gratin: "product.category.gratin",
	Takoyaki: "product.category.takoyaki",
	Sweets: "product.category.sweets",
	Alcohol: "product.category.alcohol",
	Drink: "product.category.drink",
	Frozen: "product.category.frozen",
	Other: "product.category.other",
} as const;

type CategoryLabelKey =
	(typeof categoryLabelKeys)[keyof typeof categoryLabelKeys];

export default function ProductCard({ product }: ProductCardProps) {
	const { t, i18n } = useTranslation();
	const language = i18n.language as Language;

	const image = product.images[0];
	const title = resolveLocalizedText(product.title, language);
	const storeLabelKey =
		storeLabelKeys[product.store as keyof typeof storeLabelKeys];
	const categoryLabelKey =
		product.category &&
		categoryLabelKeys[product.category as keyof typeof categoryLabelKeys];

	return (
		<Link
			to="/products/$id"
			params={{ id: product.id }}
			aria-label={title}
			className="group block h-full rounded-2xl border border-border/50 bg-background shadow-sm transition-shadow duration-200 hover:border-border hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<article className="flex h-full flex-col overflow-hidden rounded-2xl">
				<div className="relative aspect-4/3 w-full overflow-hidden border-b border-border/60 bg-muted">
					{image ? (
						<img
							src={image}
							alt={title}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							loading="lazy"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
							{t("product.noImage")}
						</div>
					)}

					{product.isNew ? (
						<span className="absolute left-3 top-3 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
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
						<h3 className="text-base font-semibold text-foreground">{title}</h3>
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
							{formatPrice(product.price, language)}
						</span>
					</div>
				</div>
			</article>
		</Link>
	);
}
