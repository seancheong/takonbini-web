import { createFileRoute } from "@tanstack/react-router";
import {
	CatalogScreen,
	catalogSearch,
	productQueries,
} from "@/features/products/products";

export const Route = createFileRoute("/")({
	component: Catalog,
	validateSearch: catalogSearch.parse,
	loaderDeps: ({ search }) => ({ search: catalogSearch.parse(search) }),
	loader: ({ context, deps }) => {
		return context.queryClient.prefetchInfiniteQuery(
			productQueries.catalog(catalogSearch.normalize(deps.search)),
		);
	},
	head: ({ match }) => ({ meta: [{ title: match.context.i18n.t("appName") }] }),
});

function Catalog() {
	const filters = catalogSearch.normalize(
		catalogSearch.parse(Route.useSearch()),
	);
	const navigate = Route.useNavigate();
	return (
		<CatalogScreen
			filters={filters}
			onApply={(next) =>
				navigate({
					search: catalogSearch.encode(next),
					replace: true,
					resetScroll: true,
				})
			}
		/>
	);
}
