import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

registerHooks({
	resolve(specifier, context, nextResolve) {
		const result = nextResolve(specifier, context);
		if (
			/\/_libs\/(react|react-dom|tanstack__react-router)\.mjs$/.test(result.url)
		) {
			throw new Error("Image request loaded the React SSR dependency graph");
		}
		return result;
	},
});

const directory = resolve(
	process.argv[2] ?? ".vercel/output/functions/__server.func",
);
const app = (await import(pathToFileURL(`${directory}/index.mjs`))).default;
const invalid = await app.fetch(
	new Request("https://web.example.test/api/image"),
);
assert.equal(invalid.status, 400);
assert.equal(invalid.headers.get("cache-control"), "no-store");

const input = await readFile(new URL("../public/icon.png", import.meta.url));
let downloads = 0;
globalThis.fetch = async (inputUrl) => {
	const url = new URL(inputUrl instanceof Request ? inputUrl.url : inputUrl);
	assert.equal(url.href, "https://www.family.co.jp/isolation-fixture.png");
	downloads++;
	return new Response(input, { headers: { "content-type": "image/png" } });
};
const response = await app.fetch(
	new Request(
		"https://web.example.test/api/image?url=https%3A%2F%2Fwww.family.co.jp%2Fisolation-fixture.png&w=320",
	),
);
assert.equal(response.status, 200);
assert.equal(response.headers.get("content-type"), "image/webp");
assert.equal(downloads, 1);
const output = Buffer.from(await response.arrayBuffer());
assert.equal(output.toString("ascii", 0, 4), "RIFF");
assert.equal(output.toString("ascii", 8, 12), "WEBP");
console.log(
	"Compiled image validation and native transform pass without loading React SSR.",
);
const shared = await app.fetch(
	new Request(
		"https://web.example.test/api/share-image?url=https%3A%2F%2Fwww.family.co.jp%2Fisolation-fixture.png",
	),
);
assert.equal(shared.status, 200);
assert.equal(shared.headers.get("content-type"), "image/jpeg");
assert.equal(Buffer.from(await shared.arrayBuffer()).readUInt16BE(0), 0xffd8);
assert.equal(downloads, 2);
console.log("Compiled sharing JPEG delivery passes without loading React SSR.");
