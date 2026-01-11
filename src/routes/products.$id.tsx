import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products/$id")({
	component: ProductDetails,
});

function ProductDetails() {
	const { id } = Route.useParams();

	return (
		<div className="min-h-screen bg-background px-4 pb-16 pt-24">
			<div className="mx-auto w-full max-w-3xl">
				<h1 className="text-2xl font-semibold text-foreground">Product {id}</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Details page placeholder.
				</p>
			</div>
		</div>
	);
}
