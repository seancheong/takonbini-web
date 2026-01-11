import { createFileRoute } from "@tanstack/react-router";
import ProductPanel from "@/features/product/components/ProductPanel";
import i18n from "@/i18n";
import { productsInfiniteQueryOptions } from "@/services/productService";

export const Route = createFileRoute("/")({
	component: App,
	loader: async ({ context }) => {
		await context.queryClient.prefetchInfiniteQuery(
			productsInfiniteQueryOptions(),
		);
	},
	head: () => ({
		meta: [{ title: i18n.t("appName") }],
	}),
});

function App() {
	return (
		<div className="min-h-screen bg-background px-4 pb-16 pt-24">
			<ProductPanel />
		</div>
	);
}
