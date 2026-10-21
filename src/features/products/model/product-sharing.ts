import { type Language, resolveSupportedLanguage } from "@/localization";
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

export function getProductShareUrl(
	origin: string,
	id: string,
	language: Language,
) {
	const hostname = new URL(origin).hostname;
	const loopback =
		hostname === "localhost" ||
		hostname.endsWith(".localhost") ||
		hostname === "[::1]" ||
		/^127\.\d+\.\d+\.\d+$/.test(hostname);
	const url = new URL(
		`/products/${encodeURIComponent(id)}`,
		loopback ? "https://takonbini.com" : origin,
	);
	url.searchParams.set("lang", language);
	return url.href;
}
