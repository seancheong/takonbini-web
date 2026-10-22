import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const products = ["one", "two", "no-photo", "fallback"].map((id, index) => ({
	id,
	title: { ja: `商品${index}`, en: `Product ${index}`, zh: `商品中文${index}` },
	description: {
		ja: `説明${index}`,
		en: `Description ${index}`,
		zh: `描述${index}`,
	},
	price: 180,
	images:
		id === "no-photo"
			? []
			: [`https://www.family.co.jp/sharing-fixture-${index}.png`],
	url: "https://www.family.co.jp/fixture",
	store: "Lawson",
}));
products[3].title = { ja: "日本語の代替タイトル" };
products[3].description = { ja: "", zh: "中文描述" };
products.push({...products[0], id: "mixed", title: {ja: "商品", en: "Product"}, description: {ja: "説明"}});
let indexReads = 0;
let oversizedIndex = false;
const api = createServer((request, response) => {
	response.setHeader("content-type", "application/json");
	const path = new URL(request.url, "http://fixture.test").pathname;
	if (path === "/products") {
		indexReads++;
		return response.end(JSON.stringify({ products: oversizedIndex ? Array.from({length:16666}, (_,i) => ({...products[0],id:String(i)})) : products }));
	}
	const product = products.find((item) => path === `/products/${item.id}`);
	response.statusCode = product ? 200 : 404;
	response.end(JSON.stringify(product ?? { error: "Not found" }));
});
await new Promise((done) => api.listen(0, "127.0.0.1", done));
const address = api.address();
assert.ok(address && typeof address === "object");
process.env.PRODUCTS_API_URL = `http://127.0.0.1:${address.port}`;
process.env.PRODUCTS_API_KEY = "synthetic-local-fixture";
process.env.SITE_URL = "https://canonical.example.test";
const directory = resolve(
	process.argv[2] ?? ".vercel/output/functions/__server.func",
);
const app = (await import(pathToFileURL(`${directory}/index.mjs`))).default;
function meta(html, key) {
	return Array.from(html.matchAll(/<meta\b[^>]*>/g))
		.map(([tag]) => {
			const attributes = Object.fromEntries(
				Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), ([, name, value]) => [
					name,
					value,
				]),
			);
			return attributes.property === key || attributes.name === key
				? attributes.content
				: undefined;
		})
		.filter((value) => value !== undefined);
}
try {
	let samples = 0;
	for (const product of products) {
		for (const locale of ["en", "ja", "zh"]) {
			const response = await app.fetch(
				new Request(
					`https://sharing.example.test/products/${product.id}?lang=${locale}&limit=20`,
					{ headers: { "user-agent": "facebookexternalhit/1.1" } },
				),
			);
			assert.equal(response.status, 200);
			const html = await response.text();
			assert.doesNotMatch(html, /application\/ld\+json/);
			const title = product.title[locale] ?? product.title.ja;
			const description =
				product.description[locale] ||
				product.description.ja ||
				product.description.zh;
			for (const key of ["og:title", "twitter:title"])
				assert.deepEqual(meta(html, key), [
					`${title} | ${locale === "ja" ? "タコンビニ" : "Takonbini"}`,
				]);
			for (const key of [
				"description",
				"og:description",
				"twitter:description",
			])
				assert.deepEqual(meta(html, key), [description]);
			assert.deepEqual(meta(html, "og:url"), [
				`https://canonical.example.test/products/${product.id}?lang=${product.id === "fallback" || (product.id === "mixed" && locale === "zh") ? "ja" : locale}`,
			]);
			const alternates = Array.from(html.matchAll(/<link\b[^>]*>/g), ([tag]) => Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), ([,key,value]) => [key.toLowerCase(),value]))).filter(link => link.hreflang);
			const expectedLanguages = product.id === "fallback" || (product.id === "mixed" && locale === "en") ? [] : product.id === "mixed" ? ["ja"] : ["en","zh-Hant","ja"];
			assert.deepEqual(alternates.map(link => link.hreflang), expectedLanguages.length ? [...expectedLanguages,"x-default"] : []);
			for (const link of alternates) assert.ok(link.href.startsWith(`https://canonical.example.test/products/${product.id}?lang=`));

			const image = product.images[0]
				? `https://sharing.example.test/api/share-image?url=${encodeURIComponent(product.images[0])}`
				: "https://sharing.example.test/share-default.jpg";
			assert.deepEqual(meta(html, "og:image"), [image]);
			assert.deepEqual(meta(html, "twitter:image"), [image]);
			assert.deepEqual(meta(html, "og:image:type"), ["image/jpeg"]);
			assert.deepEqual(
				meta(html, "og:image:width"),
				product.images.length ? [] : ["1200"],
			);
			assert.equal((html.match(/<title>/g) ?? []).length, 1);
			samples++;
		}
	}
	for (const path of ["/?lang=en", "/products/missing?lang=zh"]) {
		const response = await app.fetch(
			new Request(`https://sharing.example.test${path}`),
		);
		const html = await response.text();
		assert.deepEqual(meta(html, "og:image"), [
			"https://sharing.example.test/share-default.jpg",
		]);
		assert.deepEqual(meta(html, "og:title"), [path.startsWith("/?")
			? "Takonbini — Discover Japanese Convenience Store Products" : "Takonbini"]);
		samples++;
	}
	const homepageTitles = {
		en: "Takonbini — Discover Japanese Convenience Store Products",
		ja: "タコンビニ（Takonbini）｜日本のコンビニ商品を探す",
		zh: "Takonbini｜探索日本便利商店商品",
	};
	for (const [locale, title] of Object.entries(homepageTitles)) {
		const response = await app.fetch(new Request(`https://sharing.example.test/?lang=${locale}`, { headers: { cookie: "i18nextTakonbiniLng=ja", "accept-language": "ja" } }));
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.deepEqual(Array.from(html.matchAll(/<title>(.*?)<\/title>/g), ([, value]) => value), [title]);
		for (const key of ["og:title", "twitter:title"]) assert.deepEqual(meta(html, key), [title]);
		const description = meta(html, "description");
		assert.equal(description.length, 1);
		assert.match(description[0], /Takonbini/);
		for (const key of ["og:description", "twitter:description"]) assert.deepEqual(meta(html, key), description);
		assert.deepEqual(meta(html, "og:url"), [`https://canonical.example.test/?lang=${locale}`]);
		for (const [code, language] of [["en", "en"], ["ja", "ja"], ["zh", "zh-Hant"], [null, "x-default"]]) {
			assert.ok(html.includes(`hrefLang="${language}"`) || html.includes(`hreflang="${language}"`));
			assert.ok(html.includes(`href="https://canonical.example.test/${code ? `?lang=${code}` : ""}"`));
		}
		const scripts = Array.from(html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs), ([, json]) => JSON.parse(json));
		assert.deepEqual(scripts, [{ "@context": "https://schema.org", "@type": "WebSite", name: "Takonbini", alternateName: "タコンビニ", url: "https://canonical.example.test/" }]);
	}

	for (const locale of ["en", "ja", "zh"]) {
		const response = await app.fetch(new Request("https://sharing.example.test/?search=tea&limit=100000", { headers: { cookie: `i18nextTakonbiniLng=${locale}` } }));
		const html = await response.text();
		assert.deepEqual(meta(html, "og:url"), [`https://canonical.example.test/?lang=${locale}`]);
		assert.ok(html.includes(`rel="canonical" href="https://canonical.example.test/?lang=${locale}"`));
	}

	const indexReadsBefore = indexReads;
	const sitemapResponse = await app.fetch(new Request("https://sharing.example.test/sitemap.xml"));
	assert.equal(sitemapResponse.status, 200);
	const sitemap = await sitemapResponse.text();
	const locations = Array.from(sitemap.matchAll(/<loc>(.*?)<\/loc>/g), ([, value]) => value);
	assert.deepEqual(locations.slice(0, 3), ["en", "zh", "ja"].map(locale => `https://canonical.example.test/?lang=${locale}`));
	assert.equal(locations.length, 14);
	assert.ok(locations.includes("https://canonical.example.test/products/fallback?lang=ja"));
	assert.ok(!locations.some(url => /products\/(fallback|mixed)\?lang=(en|zh)/.test(url)));
	assert.equal(indexReads - indexReadsBefore, 1);
	oversizedIndex = true;
	const oversized = await app.fetch(new Request("https://sharing.example.test/sitemap.xml"));
	assert.equal(oversized.status, 503);
	assert.equal(oversized.headers.get("cache-control"), "no-store");
	assert.doesNotMatch(await oversized.text(), /<urlset/);
	assert.equal(new Set(locations).size, locations.length);

	const invalid = await app.fetch(
		new Request(
			"https://sharing.example.test/api/share-image?url=http://127.0.0.1/private",
		),
	);
	assert.equal(invalid.status, 302);
	assert.equal(invalid.headers.get("location"), "/share-default.jpg");
	const jpeg = await readFile(
		new URL("../public/share-default.jpg", import.meta.url),
	);
	assert.equal(jpeg.readUInt16BE(0), 0xffd8);
	console.log(
		`${samples} compiled crawler-HTML cases pass with single localized sharing tags; native sharing-image fallback passes.`,
	);
} finally {
	api.closeAllConnections();
	await new Promise((done) => api.close(done));
}
