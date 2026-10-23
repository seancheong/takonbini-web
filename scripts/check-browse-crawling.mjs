import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";

let products = Array.from({ length: 45 }, (_, index) => ({
	id: (index + 1).toString(16).padStart(32, "0"),
	title: { ja: `商品${index}`, en: `Product ${index}`, zh: `商品中文${index}` },
	description: { ja: "説明", en: "Description", zh: "描述" },
	images: [],
	store: "Lawson",
	price: 100,
	url: "https://www.lawson.co.jp/fixture",
}));
let reads = 0;
let unavailable = false;
const api = createServer((request, response) => {
	response.setHeader("content-type", "application/json");
	const url = new URL(request.url, "http://fixture.test");
	if (url.pathname === "/products/discovery") {
		reads++;
		if (unavailable) {
			response.statusCode = 503;
			return response.end(JSON.stringify({ error: "Unavailable" }));
		}
		assert.equal(url.searchParams.has("limit"), false);
		const after = url.searchParams.get("after");
		const candidates = products.filter(
			(product) => !after || product.id > after,
		);
		const page = candidates.slice(0, 20);
		return response.end(
			JSON.stringify({
				products: page,
				...(candidates.length > 20 ? { nextAfter: page.at(-1).id } : {}),
			}),
		);
	}
	if (url.pathname === "/products")
		return response.end(JSON.stringify({ products: products.slice(0, 20) }));
	const product = products.find(
		(product) => url.pathname === `/products/${product.id}`,
	);
	response.statusCode = product ? 200 : 404;
	response.end(JSON.stringify(product ?? { error: "Not found" }));
});
await new Promise((done) => api.listen(0, "127.0.0.1", done));
const address = api.address();
assert.ok(address && typeof address === "object");
process.env.PRODUCTS_API_URL = `http://127.0.0.1:${address.port}`;
process.env.PRODUCTS_API_KEY = "synthetic-browse-fixture";
process.env.SITE_URL = "https://canonical.example.test";
const app = (
	await import(
		pathToFileURL(resolve(".vercel/output/functions/__server.func/index.mjs"))
	)
).default;
const attributes = (tag) =>
	Object.fromEntries(
		Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), ([, name, value]) => [
			name.toLowerCase(),
			value.replaceAll("&amp;", "&"),
		]),
	);
async function page(path) {
	const before = reads;
	const response = await app.fetch(
		new Request(new URL(path, "https://browse.example.test")),
	);
	const html = await response.text();
	const links = Array.from(html.matchAll(/<link\b[^>]*>/g), ([tag]) =>
		attributes(tag),
	);
	const anchors = Array.from(html.matchAll(/<a\b[^>]*>/g), ([tag]) =>
		attributes(tag),
	);
	return {
		location: response.headers.get("location"),
		status: response.status,
		html,
		links,
		anchors,
		reads: reads - before,
	};
}
if (process.argv.includes("--serve")) {
	const staticRoot = resolve(".vercel/output/static");
	const server = createServer(async (request, response) => {
		try {
			const url = new URL(request.url, "http://127.0.0.1:3206");
			const path = resolve(staticRoot, "." + decodeURIComponent(url.pathname));
			if (path.startsWith(staticRoot + "/") && extname(path)) {
				try {
					const content = await readFile(path);
					const types = {
						".js": "text/javascript",
						".css": "text/css",
						".svg": "image/svg+xml",
						".png": "image/png",
						".ico": "image/x-icon",
						".jpg": "image/jpeg",
					};
					response.setHeader(
						"content-type",
						types[extname(path)] ?? "application/octet-stream",
					);
					response.end(content);
					return;
				} catch (error) {
					if (error.code !== "ENOENT" && error.code !== "EISDIR") throw error;
				}
			}
			const result = await app.fetch(
				new Request(url, { method: request.method, headers: request.headers }),
			);
			response.writeHead(result.status, Object.fromEntries(result.headers));
			response.end(Buffer.from(await result.arrayBuffer()));
		} catch (error) {
			console.error(error);
			response.statusCode = 500;
			response.end("Fixture server error");
		}
	});
	server.listen(3206, "127.0.0.1", () =>
		console.log("Compiled browse fixture on http://127.0.0.1:3206"),
	);
	await new Promise(() => {});
} else
	try {
		const home = await page("/?lang=en");
		assert.ok(
			home.anchors.some(
				(anchor) =>
					new URL(anchor.href, "https://browse.example.test").pathname ===
					"/browse",
			),
		);
		for (const locale of ["en", "ja", "zh"]) {
			let path = `/browse?lang=${locale}`;
			const visited = [];
			let pages = 0;
			do {
				const current = new URL(path, "https://browse.example.test");
				const result = await page(path);
				assert.equal(result.status, 200);
				assert.equal(result.reads, 1);
				const ids = result.anchors
					.filter((anchor) => anchor["data-product-id"])
					.map((anchor) => anchor["data-product-id"]);
				assert.ok(ids.length <= 20 && ids.length > 0);
				visited.push(...ids);
				const canonical = new URL("/browse", "https://canonical.example.test");
				canonical.searchParams.set("lang", locale);
				const after = current.searchParams.get("after");
				if (after) canonical.searchParams.set("after", after);
				assert.deepEqual(
					result.links
						.filter((link) => link.rel === "canonical")
						.map((link) => link.href),
					[canonical.href],
				);
				const alternates = result.links.filter((link) => link.hreflang);
				assert.deepEqual(
					alternates.map((link) => link.hreflang),
					["en", "zh-Hant", "ja", "x-default"],
				);
				for (const alternate of alternates)
					assert.equal(
						new URL(alternate.href).searchParams.get("after"),
						after,
					);
				const next = result.anchors
					.map((anchor) => new URL(anchor.href, "https://browse.example.test"))
					.filter(
						(url) =>
							url.pathname === "/browse" && url.searchParams.has("after"),
					);
				assert.ok(next.length <= 1);
				if (next[0])
					assert.equal(next[0].searchParams.get("after"), ids.at(-1));
				path = next[0]?.pathname + (next[0]?.search ?? "");
				if (!next.length) path = undefined;
				pages++;
				assert.ok(pages <= 3, "Traversal must terminate");
			} while (path);
			assert.equal(pages, 3);
			assert.deepEqual(
				visited,
				products.map((product) => product.id),
			);
		}
		const boundary = products[19].id;
		products = products.filter((product) => product.id !== boundary);
		products.unshift({ ...products[0], id: "0".repeat(32) });
		const continued = await page(`/browse?lang=en&after=${boundary}`);
		assert.equal(continued.status, 200);
		assert.equal(
			continued.anchors.filter((anchor) => anchor["data-product-id"])[0][
				"data-product-id"
			],
			"15".padStart(32, "0"),
		);
		for (const path of [
			"/browse?after=bad",
			"/browse?after=",
			"/browse?after=one&after=two",
		]) {
			let invalid = await page(path);
			assert.equal(invalid.reads, 0);
			if (invalid.status === 307) {
				assert.equal(invalid.location, "/browse?after=invalid");
				invalid = await page(invalid.location);
			}
			assert.equal(invalid.status, 404);
			assert.equal(invalid.reads, 0);
		}
		assert.equal((await page(`/browse?after=${"f".repeat(32)}`)).status, 404);
		const extra = await page("/browse?lang=en&search=tea&limit=100000");
		assert.equal(extra.status, 200);
		assert.deepEqual(
			extra.links
				.filter((link) => link.rel === "canonical")
				.map((link) => link.href),
			["https://canonical.example.test/browse?lang=en"],
		);
		unavailable = true;
		assert.equal((await page("/browse?lang=en")).status, 500);
		console.log(
			"Browse HTML traversal passes: three locales × three bounded pages, every product reachable once, reciprocal slice URLs, deleted-anchor continuation, invalid/empty boundaries404 and upstream failure500.",
		);
	} finally {
		api.closeAllConnections();
		await new Promise((done) => api.close(done));
	}
