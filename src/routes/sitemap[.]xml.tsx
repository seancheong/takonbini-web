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
		`  <url>
    <loc>${escapeXml(`${siteUrl}/`)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
		...ids.map(
			(id) => `  <url>
    <loc>${escapeXml(`${siteUrl}/products/${id}`)}</loc>
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
					// Preserve legacy partial sitemaps for HTTP failures and missing configuration.
					if (
						!result.ok &&
						result.origin !== "http" &&
						result.kind !== "misconfigured"
					)
						throw new Error("Unable to enumerate sitemap products");
					const ids = result.ok ? result.value.ids : (result.partialIds ?? []);
					const xml = buildSitemapXml(siteUrl, ids);

					return new Response(xml, {
						status: 200,
						headers: {
							"content-type": "application/xml; charset=utf-8",
						},
					});
				},
			}),
	},
	component: () => null,
});
