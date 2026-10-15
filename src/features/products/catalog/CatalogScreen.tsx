import ScrollTopButton from "@/components/ScrollTopButton";
import type { ProductFilters } from "../products.contracts";
import CatalogPanel from "./CatalogPanel";

export default function CatalogScreen({
	filters,
	onApply,
}: {
	filters: ProductFilters;
	onApply: (filters: ProductFilters) => void;
}) {
	return (
		<div className="min-h-screen bg-background px-4 pb-16 pt-28">
			<CatalogPanel filters={filters} onApply={onApply} />
			<ScrollTopButton />
		</div>
	);
}
