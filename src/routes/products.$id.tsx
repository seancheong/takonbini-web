import {
	createFileRoute,
	useParams,
	useRouter,
	useSearch,
} from "@tanstack/react-router";
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
	errorComponent: DetailError,
	component: () => (
		<ProductDetailScreen
			id={Route.useParams().id}
			filters={catalogSearch.parse(Route.useSearch())}
		/>
	),
});

function DetailError() {
	const { id } = useParams({ from: "/products/$id" });
	const filters = catalogSearch.parse(useSearch({ from: "/products/$id" }));
	const router = useRouter();
	return (
		<ProductDetailError
			id={id}
			filters={filters}
			onRecovered={async () => {
				await router.invalidate();
				document.querySelector<HTMLElement>("main h1")?.focus();
			}}
		/>
	);
}
