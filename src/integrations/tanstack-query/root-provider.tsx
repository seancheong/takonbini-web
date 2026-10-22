import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { retainLatestProductDetail } from "../../features/products/data/catalog-query-retention";

export function getContext() {
	const queryClient = new QueryClient();
	retainLatestProductDetail(queryClient);
	return {
		queryClient,
	};
}

export function Provider({
	children,
	queryClient,
}: {
	children: React.ReactNode;
	queryClient: QueryClient;
}) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
