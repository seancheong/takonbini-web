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

const buildSitemapXml = (siteUrl: string, ids: string[]) => {
	const urls = [
		...SUPPORTED_LANGUAGES.map(
			(language) => `  <url>
    <loc>${escapeXml(`${siteUrl}/?lang=${language}`)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
		),
		...ids.map(
			(id) => `  <url>
    <loc>${escapeXml(`${siteUrl}/products/${encodeURIComponent(id)}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
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
					const result = await getProductCatalogSource().listIndexableIds();
					if (
						result.ok &&
						result.value.complete &&
						result.value.ids.length <= 50_000 - SUPPORTED_LANGUAGES.length
					) {
						const xml = buildSitemapXml(siteUrl, result.value.ids);
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
