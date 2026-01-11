import type { PublicProduct } from "@/@types/product";
import ProductCard from "./ProductCard";

interface ProductGridProps {
	products: PublicProduct[];
}

export default function ProductGrid({ products }: ProductGridProps) {
	return (
		<div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{products.map((product) => (
				<ProductCard key={product.id} product={product} />
			))}
		</div>
	);
}
