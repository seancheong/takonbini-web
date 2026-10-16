import { createFileRoute } from "@tanstack/react-router";
import {
	catalogSearch,
	ProductDetailError,
	ProductDetailPending,
	ProductDetailScreen,
	productQueries,
} from "@/features/products/products";

export const Route = createFileRoute("/products/$id")({
	validateSearch: catalogSearch.parse,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(productQueries.detail(params.id));
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
