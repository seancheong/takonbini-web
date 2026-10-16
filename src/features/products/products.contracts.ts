import { z } from "zod";
import { Category, REGIONS, type Region, Store } from "./model/product-values";

export {
	Category,
	JAPANESE_REGION_MAP,
	REGIONS,
	type Region,
	Store,
} from "./model/product-values";

export const localizedProductTextSchema = z.object({
	ja: z.string(),
	en: z.string().optional(),
	zh: z.string().optional(),
});

export const activeCatalogProductSchema = z.object({
	id: z.string(),
	title: localizedProductTextSchema,
	price: z.number(),
	description: localizedProductTextSchema,
	images: z.array(z.string()),
	url: z.string(),
	store: z.enum(Store),
	releaseDate: z.string().nullable().optional(),
	category: z.enum(Category).optional(),
	regions: z.array(z.enum(REGIONS)).optional(),
	isNew: z.boolean().optional(),
});

export type ActiveCatalogProduct = z.infer<typeof activeCatalogProductSchema>;
export const catalogPageSchema = z.object({
	products: z.array(activeCatalogProductSchema),
	nextCursor: z.string().optional(),
});
export type CatalogPage = z.infer<typeof catalogPageSchema>;
export const catalogIndexPageSchema = z.object({
	products: z.array(z.object({ id: z.string() })),
	nextCursor: z.string().optional(),
});

export const productStatuses = [
	"allWithoutSoon",
	"new",
	"soon",
	"all",
] as const;
export type ProductStatus = (typeof productStatuses)[number];
export type ProductFilters = {
	search?: string;
	stores?: Store[];
	categories?: Category[];
	regions?: Region[];
	minPrice?: number;
	maxPrice?: number;
	limit?: number;
	includeSoon?: boolean;
};
