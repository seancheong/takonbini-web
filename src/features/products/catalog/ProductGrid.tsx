import * as stylex from "@stylexjs/stylex";
import type {
	ActiveCatalogProduct,
	ProductFilters,
} from "@/features/products/products.contracts";
import { conditions } from "../../../styles/conditions.stylex";
import ProductCard from "./ProductCard";

interface ProductGridProps {
	products: ActiveCatalogProduct[];
	filters?: ProductFilters;
}
export default function ProductGrid({ products, filters }: ProductGridProps) {
	return (
		<div {...stylex.props(layoutStyles.grid)}>
			{products.map((product) => (
				<ProductCard key={product.id} product={product} filters={filters} />
			))}
		</div>
	);
}
const layoutStyles = stylex.create({
	grid: {
		display: "grid",
		gridTemplateColumns: {
			default: "minmax(0, 1fr)",
			[conditions.indexTablet]: "repeat(2, minmax(0, 1fr))",
			[conditions.indexDesktop]: "repeat(3, minmax(0, 1fr))",
		},
		gap: {
			default: "1.5rem 1rem",
			[conditions.compactCatalog]: "1rem 0.65rem",
		},
	},
});
