import type { Language } from "../localization";
import { SUPPORTED_LANGUAGES } from "../localization";
import { createFileRoute } from "@tanstack/react-router";
import { getProductCatalogSource } from "@/features/products/products.server";

const getSiteUrl = (request: Request) => {
	const siteUrl = process.env.SITE_URL;
	if (siteUrl) {
		return siteUrl.replace(/\/$/, "");
	}

	const host = new URL(request.url).host;
	return `https://${host}`;
};

const escapeXml = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildSitemapXml = (
	siteUrl: string,
	products: { id: string; languages: Language[] }[],
) => {
	const urls = [
		...SUPPORTED_LANGUAGES.map(
			(language) => `  <url>
    <loc>${escapeXml(`${siteUrl}/?lang=${language}`)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
		),
		...products.flatMap(({ id, languages }) =>
			languages.map(
				(language) => `  <url>
    <loc>${escapeXml(`${siteUrl}/products/${encodeURIComponent(id)}?lang=${language}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
			),
		),
	];

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join(
		"\n",
	)}\n</urlset>`;
};

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: async ({ request }) => {
					const siteUrl = getSiteUrl(request);
					const result =
						await getProductCatalogSource().listIndexableProducts();
					if (
						result.ok &&
						result.value.complete &&
						result.value.products.reduce<number>(
							(count, product) => count + product.languages.length,
							SUPPORTED_LANGUAGES.length,
						) <= 50_000
					) {
						const xml = buildSitemapXml(siteUrl, result.value.products);
						if (new TextEncoder().encode(xml).byteLength <= 52_428_800)
							return new Response(xml, {
								status: 200,
								headers: { "content-type": "application/xml; charset=utf-8" },
							});
					}
					return new Response("Sitemap temporarily unavailable", {
						status: 503,
						headers: { "cache-control": "no-store", "retry-after": "300" },
					});
				},
			}),
	},
	component: () => null,
});
