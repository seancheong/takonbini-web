import { createFileRoute } from "@tanstack/react-router";

type ProductsResponse = {
	products: Array<{ id: string }>;
	nextCursor?: string;
};

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

const fetchAllProductIds = async () => {
	const baseUrl = process.env.PRODUCTS_API_URL;
	const apiKey = process.env.PRODUCTS_API_KEY;

	if (!baseUrl || !apiKey) {
		return [];
	}

	const ids: string[] = [];
	let cursor: string | undefined;

	for (let page = 0; page < 50; page += 1) {
		const url = new URL(`${baseUrl}/products`);
		url.searchParams.set("status", "all");
		url.searchParams.set("limit", "100");

		if (cursor) {
			url.searchParams.set("cursor", cursor);
		}

		const response = await fetch(url.toString(), {
			headers: { "x-api-key": apiKey },
		});

		if (!response.ok) {
			break;
		}

		const payload = (await response.json()) as ProductsResponse;
		ids.push(...payload.products.map((product) => product.id));

		if (!payload.nextCursor) {
			break;
		}

		cursor = payload.nextCursor;
	}

	return ids;
};

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
					const ids = await fetchAllProductIds();
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
