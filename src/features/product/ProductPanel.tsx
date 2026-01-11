import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { productsQueryOptions } from "@/services/productService";
import ProductGrid from "./ProductGrid";

export default function ProductPanel() {
	const { t } = useTranslation();

	const { data, isLoading, isError } = useQuery(productsQueryOptions());
	const products = data?.products ?? [];

	return (
		<section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
			<div>
				<h1 className="text-4xl font-bold text-foreground">
					{t("product.title")}
				</h1>
				<p className="mt-3 text-base text-muted-foreground">
					{t("product.subtitle")}
				</p>
			</div>

			{isError ? (
				<div className="rounded-2xl border border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground">
					{t("product.error")}
				</div>
			) : null}

			{isLoading ? (
				<div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<div
							key={`product-skeleton-${
								// biome-ignore lint/suspicious/noArrayIndexKey: ignore for skeleton keys
								index
							}`}
							className="h-90 animate-pulse rounded-2xl border border-border/50 bg-muted/40"
						/>
					))}
				</div>
			) : products.length ? (
				<ProductGrid products={products} />
			) : (
				<div className="rounded-2xl border border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground">
					{t("product.empty")}
				</div>
			)}
		</section>
	);
}
