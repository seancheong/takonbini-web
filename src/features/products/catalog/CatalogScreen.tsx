import * as stylex from "@stylexjs/stylex";
import ScrollTopButton from "@/components/ScrollTopButton";
import { colors } from "../../../styles/colors.stylex";
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
		<div {...stylex.props(layoutStyles.div)}>
			<CatalogPanel filters={filters} onApply={onApply} />
			<ScrollTopButton />
		</div>
	);
}
const layoutStyles = stylex.create({
	div: {
		minHeight: "100vh",
		backgroundColor: colors.background,
		paddingLeft: "1rem",
		paddingRight: "1rem",
		paddingBottom: "4rem",
		paddingTop: "7rem",
	},
});
