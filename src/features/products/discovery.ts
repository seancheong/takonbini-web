import { z } from "zod";
import { activeCatalogProductSchema } from "./products.contracts";

export const discoveryBoundary = z.string().regex(/^[a-f0-9]{32}$/);
export const discoveryInput = z.object({ after: discoveryBoundary.optional() });
export const discoveryPageSchema = z
	.object({
		products: z
			.array(activeCatalogProductSchema.extend({ id: discoveryBoundary }))
			.max(20),
		nextAfter: discoveryBoundary.optional(),
	})
	.superRefine((page, context) => {
		if (
			page.products.some(
				(product, index) =>
					index > 0 && product.id <= page.products[index - 1].id,
			) ||
			(page.nextAfter &&
				(page.products.length !== 20 ||
					page.nextAfter !== page.products.at(-1)?.id))
		) {
			context.addIssue({
				code: "custom",
				message: "Invalid discovery ordering or continuation",
			});
		}
	});
export type DiscoveryPage = z.infer<typeof discoveryPageSchema>;
export function parseBrowseSearch(search: Record<string, unknown>): {
	after?: string;
} {
	return {
		after:
			search.after === undefined
				? undefined
				: typeof search.after === "string"
					? search.after
					: "invalid",
	};
}
