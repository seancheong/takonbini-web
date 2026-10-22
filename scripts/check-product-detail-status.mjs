import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

process.env.PRODUCTS_API_URL = "https://catalog.example.test";
process.env.PRODUCTS_API_KEY = "fixture-key";
process.env.SITE_URL = "https://web.example.test";

let reads = 0;
globalThis.fetch = async (input) => {
	const url = new URL(input instanceof Request ? input.url : input);
	assert.equal(url.origin, "https://catalog.example.test");
	reads++;
	const id = url.pathname.split("/").at(-1);
	if (id === "missing")
		return Response.json({ error: "Product not found" }, { status: 404 });
	if (id === "unavailable") return new Response("Unavailable", { status: 503 });
	if (id === "offline") throw new TypeError("Controlled offline fixture");
	if (id === "invalid") return Response.json({ id });
	assert.equal(id, "available");
	return Response.json({
		id,
		title: { en: "Fixture product", ja: "テスト商品", zh: "測試商品" },
		description: { ja: "ローカルテスト" },
		price: 150,
		images: [],
		url: "https://example.test/product",
		store: "Lawson",
	});
};
const directory = resolve(
	process.argv[2] ?? ".vercel/output/functions/__server.func",
);
const app = (await import(pathToFileURL(`${directory}/index.mjs`))).default;
const locales = [
	{
		lang: "en",
		documentLang: "en",
		errorTitle: "Product unavailable",
		title: "Fixture product",
	},
	{
		lang: "ja",
		documentLang: "ja",
		errorTitle: "商品を表示できません",
		title: "テスト商品",
	},
	{
		lang: "zh",
		documentLang: "zh-Hant",
		errorTitle: "無法顯示商品",
		title: "測試商品",
	},
];
for (const locale of locales) {
	for (const [id, status] of [
		["missing", 404],
		["available", 200],
		["unavailable", 500],
		["invalid", 500],
		["offline", 500],
	]) {
		const before = reads;
		const search = new URLSearchParams({
			lang: locale.lang,
			stores: JSON.stringify(["Lawson"]),
		});
		const response = await app.fetch(
			new Request(`https://web.example.test/products/${id}?${search}`),
		);
		assert.equal(response.status, status, `${id}/${locale.lang}: HTTP status`);
		const html = await response.text();
		assert.equal(reads - before, 1, `${id}/${locale.lang}: one upstream fetch`);
		assert.ok(
			html.includes(`lang="${locale.documentLang}"`),
			`${id}/${locale.lang}: document locale`,
		);
		const title = status === 200 ? locale.title : locale.errorTitle;
		assert.match(
			html,
			new RegExp(`<h1[^>]*>${title}</h1>`),
			`${id}/${locale.lang}: compiled route renders its recovery/detail component`,
		);
		assert.match(
			html,
			/href="\/\?[^\"]*stores=[^\"]*Lawson/,
			`${id}/${locale.lang}: filtered catalog return`,
		);
	}
}
console.log(
	"Compiled detail status, localized recovery UI and single-fetch checks pass: 15 cases.",
);
