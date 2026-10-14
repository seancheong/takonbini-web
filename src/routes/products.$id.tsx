import { createFileRoute } from "@tanstack/react-router";
import { parseCatalogSearch } from "@/features/products/catalog/catalog-search";
import { productByIdQueryOptions } from "@/features/products/data/product-queries";
import ProductDetailError from "@/features/products/detail/ProductDetailError";
import ProductDetailPending from "@/features/products/detail/ProductDetailPending";
import ProductDetailScreen from "@/features/products/detail/ProductDetailScreen";

export const Route = createFileRoute("/products/$id")({
	validateSearch: parseCatalogSearch,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			productByIdQueryOptions(params.id),
		);
	},
	pendingComponent: ProductDetailPending,
	errorComponent: () => <ProductDetailError filters={Route.useSearch()} />,
	component: () => (
		<ProductDetailScreen
			id={Route.useParams().id}
			filters={Route.useSearch()}
		/>
	),
});
