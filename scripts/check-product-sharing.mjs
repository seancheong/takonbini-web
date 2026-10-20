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
const api = createServer((request, response) => {
	response.setHeader("content-type", "application/json");
	const path = new URL(request.url, "http://fixture.test").pathname;
	if (path === "/products") return response.end(JSON.stringify({ products }));
	const product = products.find((item) => path === `/products/${item.id}`);
	response.statusCode = product ? 200 : 404;
	response.end(JSON.stringify(product ?? { error: "Not found" }));
});
await new Promise((done) => api.listen(0, "127.0.0.1", done));
const address = api.address();
assert.ok(address && typeof address === "object");
process.env.PRODUCTS_API_URL = `http://127.0.0.1:${address.port}`;
process.env.PRODUCTS_API_KEY = "synthetic-local-fixture";
process.env.SITE_URL = "https://sharing.example.test";
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
				`https://sharing.example.test/products/${product.id}`,
			]);
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
		assert.deepEqual(meta(html, "og:title"), ["Takonbini"]);
		samples++;
	}
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
