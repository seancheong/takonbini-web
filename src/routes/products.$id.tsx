import type { QueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	notFound,
	useParams,
	useRouter,
	useSearch,
} from "@tanstack/react-router";
import {
	catalogSearch,
	ProductDetailError,
	ProductDetailPending,
	ProductDetailScreen,
	ProductNotFoundError,
	productQueries,
} from "@/features/products/products";

export const Route = createFileRoute("/products/$id")({
	codeSplitGroupings: [
		["component"],
		["pendingComponent"],
		["errorComponent", "notFoundComponent"],
	],
	validateSearch: catalogSearch.parse,
	loader: loadProductDetail,
	pendingComponent: ProductDetailPending,
	errorComponent: DetailError,
	notFoundComponent: DetailError,
	component: () => (
		<ProductDetailScreen
			id={Route.useParams().id}
			filters={catalogSearch.parse(Route.useSearch())}
		/>
	),
});

export async function loadProductDetail({
	context,
	params,
}: {
	context: { queryClient: QueryClient };
	params: { id: string };
}) {
	try {
		await context.queryClient.ensureQueryData(productQueries.detail(params.id));
	} catch (error) {
		if (error instanceof ProductNotFoundError) throw notFound();
		throw error;
	}
}

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
