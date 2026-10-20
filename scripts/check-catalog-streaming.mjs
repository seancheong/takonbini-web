import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
process.env.PRODUCTS_API_URL = "https://fixture-api.example.test";
process.env.PRODUCTS_API_KEY = "stream-fixture-key";
const product = {
	id: "stream-fixture",
	title: { ja: "抹茶", en: "Stream fixture product" },
	description: { ja: "説明" },
	price: 180,
	images: ["https://www.family.co.jp/fixture.jpg"],
	url: "https://www.family.co.jp/product",
	store: "FamilyMart",
	category: "Sweets",
};
const entered = Promise.withResolvers(),
	gate = Promise.withResolvers();
let downloads = 0;
globalThis.fetch = async (input) => {
	const url = new URL(input instanceof Request ? input.url : input);
	assert.equal(url.origin, process.env.PRODUCTS_API_URL);
	downloads++;
	entered.resolve();
	await gate.promise;
	return Response.json({ products: [product] });
};
const app = (
	await import(
		pathToFileURL(
			resolve(
				process.argv[2] ?? ".vercel/output/functions/__server.func",
				"index.mjs",
			),
		)
	)
).default;
const pending = app.fetch(
	new Request("https://web.example.test/?lang=en", {
		headers: { "user-agent": "Mozilla/5.0 Chrome/155.0.0.0 Safari/537.36" },
	}),
);
await entered.promise;
let timer;
const early = await Promise.race([
	pending,
	new Promise((r) => {
		timer = setTimeout(() => r(null), 1000);
	}),
]);
clearTimeout(timer);
let prefix = "",
	rest = "";
if (early) {
	const reader = early.body.getReader();
	const first = await reader.read();
	prefix = new TextDecoder().decode(first.value);
	gate.resolve();
	for (;;) {
		const chunk = await reader.read();
		if (chunk.done) break;
		rest += new TextDecoder().decode(chunk.value);
	}
} else {
	gate.resolve();
	rest = await (await pending).text();
}
assert.equal(downloads, 1);
assert.ok(
	(prefix + rest).includes("Stream fixture product"),
	"final HTML must contain product",
);
assert.ok(
	!(prefix + rest).includes("stream-fixture-key"),
	"credential must remain private",
);
console.log(
	JSON.stringify({
		shellBeforeSource: Boolean(early),
		initialBytes: prefix.length,
		finalBytes: prefix.length + rest.length,
		sourceRequests: downloads,
	}),
);
assert.ok(early, "Catalog source blocks the initial SSR response");
assert.match(prefix, /rel="stylesheet"/);
assert.match(prefix + rest, /<h1/);
assert.ok(!prefix.includes("Stream fixture product"));
