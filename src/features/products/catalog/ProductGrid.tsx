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
	onPreview?: (product: ActiveCatalogProduct) => void;
}
export default function ProductGrid({
	products,
	filters,
	onPreview,
}: ProductGridProps) {
	return (
		<div {...stylex.props(layoutStyles.grid)}>
			{products.map((product) => (
				<ProductCard
					key={product.id}
					product={product}
					filters={filters}
					onPreview={onPreview}
				/>
			))}
		</div>
	);
}
const layoutStyles = stylex.create({
	grid: {
		display: "grid",
		gridTemplateColumns: {
			default: "repeat(2,minmax(0,1fr))",
			[conditions.tabletGrid]: "repeat(3,minmax(0,1fr))",
		},
		gap: { default: "40px 28px", [conditions.compactCatalog]: "30px 18px" },
	},
});
