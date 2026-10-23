import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
	BrowseScreen,
	BrowseMissingScreen,
	discoveryBoundary,
	discoveryInput,
	parseBrowseSearch,
} from "@/features/products/products";
import { useLocaleUrl } from "../use-locale-url";

const readPage = createServerFn({ method: "GET" })
	.inputValidator(discoveryInput)
	.handler(async ({ data }) => {
		const { getProductCatalogSource } = await import(
			"@/features/products/products.server"
		);
		const result = await getProductCatalogSource().discovery(data.after);
		if (!result.ok) throw new Error("Failed to load catalog page");
		return result.value;
	});

export const Route = createFileRoute("/browse")({
	validateSearch: parseBrowseSearch,
	loaderDeps: ({ search }) => ({ after: search.after }),
	loader: async ({ deps }) => {
		if (
			deps.after !== undefined &&
			!discoveryBoundary.safeParse(deps.after).success
		)
			throw notFound();
		const page = await readPage({ data: deps });
		if (deps.after && page.products.length === 0) throw notFound();
		return page;
	},
	gcTime: 0,
	component: Browse,
	notFoundComponent: MissingPage,
});

function Browse() {
	useLocaleUrl();
	return (
		<BrowseScreen
			page={Route.useLoaderData()}
			after={Route.useSearch().after}
		/>
	);
}
function MissingPage() {
	useLocaleUrl();
	return <BrowseMissingScreen />;
}
