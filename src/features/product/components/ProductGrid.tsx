import type { PublicProduct } from "@/@types/product";
import type { ProductFilters } from "@/services/productService";
import ProductCard from "./ProductCard";

interface ProductGridProps {
	products: PublicProduct[];
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
