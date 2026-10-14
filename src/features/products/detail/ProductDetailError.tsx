import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProductFilters } from "../products.contracts";
export default function ProductDetailError({
	filters,
}: {
	filters: ProductFilters;
}) {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-background px-4 pb-16 pt-24">
			<div className="mx-auto w-full max-w-3xl">
				<h1 className="text-2xl font-semibold text-foreground">
					{t("product.details.notFoundTitle")}
				</h1>

				<p className="mt-2 text-sm text-muted-foreground">
					{t("product.details.notFoundBody")}
				</p>

				<Link
					to="/"
					search={filters}
					className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
				>
					<ArrowLeft className="h-4 w-4" aria-hidden="true" />
					{t("product.details.back")}
				</Link>
			</div>
		</div>
	);
}
