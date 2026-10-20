import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { afterEach, expect, it, vi } from "vitest";
import handler from "@/server/product-share-image-handler";

const source = "https://www.family.co.jp/photo.png";
const request = (
	query = `url=${encodeURIComponent(source)}`,
	init?: RequestInit,
) => new Request(`https://web.test/api/share-image?${query}`, init);
afterEach(() => vi.unstubAllGlobals());
async function photograph() {
	const bytes = await sharp({
		create: {
			width: 1600,
			height: 800,
			channels: 4,
			background: { r: 20, g: 80, b: 40, alpha: 0.5 },
		},
	})
		.png()
		.toBuffer();
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response(new Uint8Array(bytes))),
	);
}
it("serves a bounded JPEG without cropping or enlarging and supports ETag revalidation", async () => {
	await photograph();
	const response = await handler.fetch(request());
	expect(response.status).toBe(200);
	expect(response.headers.get("content-type")).toBe("image/jpeg");
	expect(response.headers.get("cache-control")).toContain("s-maxage=604800");
	const bytes = Buffer.from(await response.arrayBuffer());
	expect(await sharp(bytes).metadata()).toMatchObject({
		format: "jpeg",
		width: 1280,
		height: 640,
		hasAlpha: false,
	});
	const validated = await handler.fetch(
		request(undefined, {
			headers: { "if-none-match": response.headers.get("etag") ?? "" },
		}),
	);
	expect(validated.status).toBe(304);
	expect(await validated.text()).toBe("");
});
it("returns identical image headers without a HEAD body", async () => {
	await photograph();
	const response = await handler.fetch(request(undefined, { method: "HEAD" }));
	expect(response.status).toBe(200);
	expect(response.headers.get("content-type")).toBe("image/jpeg");
	expect(Number(response.headers.get("content-length"))).toBeGreaterThan(0);
	expect(await response.text()).toBe("");
});
it.each([
	"",
	"url=https%3A%2F%2Fevil.test%2Fimage.png",
	"url=https%3A%2F%2Fwww.family.co.jp%3A444%2Fa.png",
	"url=not-a-url",
	"url=x&url=y",
	`url=${encodeURIComponent(source)}&w=320`,
])(
	"uses uncached branded fallback without fetching invalid input: %s",
	async (query) => {
		const fetch = vi.fn();
		vi.stubGlobal("fetch", fetch);
		const response = await handler.fetch(request(query));
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("/share-default.jpg");
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(fetch).not.toHaveBeenCalled();
	},
);
it.each(["upstream", "decode", "redirect"])(
	"falls back for %s failure",
	async (kind) => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				kind === "upstream"
					? new Response(null, { status: 404 })
					: kind === "redirect"
						? new Response(null, {
								status: 302,
								headers: { location: "http://127.0.0.1/private" },
							})
						: new Response("invalid raster"),
			),
		);
		const response = await handler.fetch(request());
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("/share-default.jpg");
	},
);
it("rejects mutation methods", async () => {
	const fetch = vi.fn();
	vi.stubGlobal("fetch", fetch);
	const response = await handler.fetch(request(undefined, { method: "POST" }));
	expect(response.status).toBe(405);
	expect(fetch).not.toHaveBeenCalled();
});
it("ships the branded JPEG at its advertised dimensions", async () => {
	const bytes = await readFile(
		new URL("../public/share-default.jpg", import.meta.url),
	);
	expect(await sharp(bytes).metadata()).toMatchObject({
		format: "jpeg",
		width: 1200,
		height: 630,
	});
});
