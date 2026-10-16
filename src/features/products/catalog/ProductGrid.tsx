import type {
	ActiveCatalogProduct,
	ProductFilters,
} from "@/features/products/products.contracts";
import ProductCard from "./ProductCard";

interface ProductGridProps {
	products: ActiveCatalogProduct[];
	filters?: ProductFilters;
}

export default function ProductGrid({ products, filters }: ProductGridProps) {
	return (
		<div className="catalog-grid">
			{products.map((product) => (
				<ProductCard key={product.id} product={product} filters={filters} />
			))}
		</div>
	);
}
