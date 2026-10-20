import { resolveSupportedLanguage } from "@/localization";
import type { ActiveCatalogProduct } from "../products.contracts";
import { resolveProductText } from "./product-display";
import { isAllowedProductImageSource } from "./product-image-source";

export function productSharing(
	product: ActiveCatalogProduct | undefined,
	language: string,
	siteUrl: string,
) {
	if (!product) return undefined;
	const locale = resolveSupportedLanguage(language) ?? "en";
	const title = resolveProductText(product.title, locale).text;
	const description = resolveProductText(product.description, locale).text;
	const photo = product.images.find(isAllowedProductImageSource);
	return {
		title,
		description,
		image: photo
			? new URL(
					`/api/share-image?url=${encodeURIComponent(photo)}`,
					`${siteUrl}/`,
				).href
			: undefined,
	};
}
