import { createFileRoute } from "@tanstack/react-router";
import {
	CatalogScreen,
	catalogSearch,
	productQueries,
} from "@/features/products/products";
import i18n from "@/i18n";

export const Route = createFileRoute("/")({
	component: Catalog,
	validateSearch: catalogSearch.parse,
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) => {
		context.queryClient.prefetchInfiniteQuery(
			productQueries.catalog(catalogSearch.normalize(deps.search)),
		);
	},
	head: () => ({ meta: [{ title: i18n.t("appName") }] }),
});

function Catalog() {
	const filters = catalogSearch.normalize(Route.useSearch());
	const navigate = Route.useNavigate();
	return (
		<CatalogScreen
			filters={filters}
			onApply={(next) =>
				navigate({ search: catalogSearch.encode(next), replace: true })
			}
		/>
	);
}
