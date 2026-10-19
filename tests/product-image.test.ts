import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	catalogImageSizes,
	getProductImageSrcSet,
} from "@/features/products/model/product-images";
import { serveProductImage } from "@/server/product-image.server";

const source = "https://www.family.co.jp/content/dam/family/goods/image.jpg";
const request = (suffix = "&w=640", headers?: HeadersInit) =>
	new Request(
		`https://web.test/api/image?url=${encodeURIComponent(source)}${suffix}`,
		{ headers },
	);
const jpeg = () =>
	sharp({
		create: { width: 1200, height: 800, channels: 3, background: "#f0a030" },
	})
		.jpeg()
		.toBuffer();
afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("bounded product image delivery", () => {
	it("resizes without cropping, returns WebP and a representation validator", async () => {
		const input = await jpeg();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(new Uint8Array(input), {
					headers: {
						"content-type": "image/jpeg",
						etag: '"original"',
						"set-cookie": "private=1",
					},
				}),
			),
		);
		const response = await serveProductImage(request());
		const bytes = Buffer.from(await response.arrayBuffer());
		const metadata = await sharp(bytes).metadata();
		expect(response.status).toBe(200);
		expect(metadata).toMatchObject({ width: 640, height: 427, format: "webp" });
		expect(bytes.length).toBeLessThan(input.length);
		expect(response.headers.get("etag")).not.toBe('"original"');
		expect(response.headers.get("cache-control")).toContain("s-maxage=604800");
		expect(response.headers.has("set-cookie")).toBe(false);
	});

	it.each([
		"&w=0",
		"&w=641",
		"&w=0640",
		"&w=1601",
		"&w=640&w=960",
		"&w=640&q=1",
	])(
		"rejects unbounded transform parameters %s before fetching",
		async (suffix) => {
			const fetchMock = vi.fn();
			vi.stubGlobal("fetch", fetchMock);
			expect((await serveProductImage(request(suffix))).status).toBe(400);
			expect(fetchMock).not.toHaveBeenCalled();
		},
	);
	it.each([
		"http://www.family.co.jp/p.jpg",
		"https://www.family.co.jp.evil.test/p.jpg",
		"https://127.0.0.1/p.jpg",
		"https://user@www.family.co.jp/p.jpg",
		"https://www.family.co.jp:8443/p.jpg",
	])("rejects unsupported source %s", async (url) => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		const response = await serveProductImage(
			new Request(
				`https://web.test/api/image?url=${encodeURIComponent(url)}&w=640`,
			),
		);
		expect(response.status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it("does not follow a redirect outside the retailer allowlist", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(null, {
				status: 302,
				headers: { location: "http://169.254.169.254/latest/meta-data" },
			}),
		);
		vi.stubGlobal("fetch", fetchMock);
		expect((await serveProductImage(request())).status).toBe(502);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][1]).toMatchObject({
			redirect: "manual",
			signal: expect.any(AbortSignal),
		});
	});
	it("follows a validated relative redirect but bounds redirect loops", async () => {
		const fetchMock = vi.fn().mockImplementation(
			async () =>
				new Response(null, {
					status: 302,
					headers: { location: "/other.jpg" },
				}),
		);
		vi.stubGlobal("fetch", fetchMock);
		expect((await serveProductImage(request())).status).toBe(502);
		expect(fetchMock).toHaveBeenCalledTimes(4);
	});
	it("rejects excessive declared and streamed bodies without caching errors", async () => {
		for (const response of [
			new Response("x", { headers: { "content-length": "8388609" } }),
			new Response(new Uint8Array(8388609)),
		]) {
			vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
			const result = await serveProductImage(request());
			expect(result.status).toBe(502);
			expect(result.headers.get("cache-control")).toBe("no-store");
		}
	});
	it("rejects corrupt, vector and over-limit decoded input", async () => {
		const large = await sharp({
			create: { width: 3000, height: 3000, channels: 3, background: "white" },
		})
			.png()
			.toBuffer();
		for (const bytes of [
			Buffer.from("broken"),
			Buffer.from(
				'<svg width="10" height="10"><rect width="10" height="10"/></svg>',
			),
			large,
		]) {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockResolvedValue(new Response(new Uint8Array(bytes))),
			);
			expect((await serveProductImage(request())).status).toBe(502);
		}
	});
	it("does not upscale small sources and honors its generated ETag", async () => {
		const input = await sharp({
			create: { width: 80, height: 100, channels: 3, background: "white" },
		})
			.png()
			.toBuffer();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockImplementation(async () => new Response(new Uint8Array(input))),
		);
		const first = await serveProductImage(request());
		expect(
			await sharp(Buffer.from(await first.arrayBuffer())).metadata(),
		).toMatchObject({ width: 80, height: 100 });
		const second = await serveProductImage(
			request("&w=640", { "if-none-match": String(first.headers.get("etag")) }),
		);
		expect(second.status).toBe(304);
		expect(await second.text()).toBe("");
	});
	it("times out an upstream request and releases its work slot", async () => {
		vi.useFakeTimers();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockImplementation(
					(_url, { signal }) =>
						new Promise((_resolve, reject) =>
							signal.addEventListener(
								"abort",
								() => reject(new Error("aborted")),
								{ once: true },
							),
						),
				),
		);
		const pending = serveProductImage(request());
		await vi.advanceTimersByTimeAsync(10001);
		expect((await pending).status).toBe(502);
		vi.useRealTimers();
	});
	it("bounds active fetches and the waiting queue", async () => {
		const resolvers: Array<(response: Response) => void> = [];
		const fetchMock = vi
			.fn()
			.mockImplementation(
				() => new Promise<Response>((resolve) => resolvers.push(resolve)),
			);
		vi.stubGlobal("fetch", fetchMock);
		const requests = Array.from({ length: 29 }, () =>
			serveProductImage(request()),
		);
		await Promise.resolve();
		await Promise.resolve();
		expect(fetchMock).toHaveBeenCalledTimes(4);
		expect((await requests[28]).status).toBe(503);
		for (let batch = 0; batch < 7; batch++) {
			for (const resolve of resolvers.splice(0))
				resolve(new Response("unavailable", { status: 503 }));
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
		expect(
			(await Promise.all(requests)).every((r) => [502, 503].includes(r.status)),
		).toBe(true);
	});
	it("emits finite width candidates and the catalog breakpoint geometry", () => {
		const srcset = getProductImageSrcSet(source);
		expect(srcset.split(", ")).toHaveLength(6);
		expect(srcset).toContain("&w=640 640w");
		expect(catalogImageSizes).toContain(
			"(max-width: 600px) calc(100vw - 40px)",
		);
	});
});
