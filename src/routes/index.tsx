import { Await, createFileRoute } from "@tanstack/react-router";
import {
	CatalogScreen,
	catalogSearch,
	productQueries,
} from "@/features/products/products";

export const Route = createFileRoute("/")({
	component: Catalog,
	validateSearch: catalogSearch.parse,
	loaderDeps: ({ search }) => ({ search: catalogSearch.parse(search) }),
	loader: async ({ context, deps }) => {
		const catalogReady = context.queryClient.prefetchInfiniteQuery(
			productQueries.catalog(catalogSearch.normalize(deps.search)),
		);
		if (import.meta.env.SSR) return { catalogReady };
		await catalogReady;
		return { catalogReady: undefined };
	},
	head: ({ match }) => ({ meta: [{ title: match.context.i18n.t("appName") }] }),
});

function Catalog() {
	const filters = catalogSearch.normalize(
		catalogSearch.parse(Route.useSearch()),
	);
	const navigate = Route.useNavigate();
	const { catalogReady } = Route.useLoaderData();
	const screen = (
		<CatalogScreen
			filters={filters}
			onApply={(next) =>
				navigate({
					search: catalogSearch.encode(next),
					replace: true,
					resetScroll: false,
				})
			}
		/>
	);
	return catalogReady ? (
		<Await promise={catalogReady} fallback={screen}>
			{() => screen}
		</Await>
	) : (
		screen
	);
}
