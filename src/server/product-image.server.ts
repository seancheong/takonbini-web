import { createHash } from "node:crypto";
import sharp from "sharp";
import { productImageWidths } from "@/features/products/model/product-images";

const hosts = new Set([
	"www.family.co.jp",
	"www.lawson.co.jp",
	"img-afd.7api-01.dp1.sej.co.jp",
	"www.sej.co.jp",
]);
const maxBytes = 8 * 1024 * 1024;
const maxPixels = 8_000_000;
const cacheControl =
	"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";
sharp.cache({ memory: 16, files: 0, items: 32 });
sharp.concurrency(1);

let active = 0;
const waiting: Array<() => void> = [];

async function acquire() {
	if (active < 4) {
		active++;
		return;
	}
	if (waiting.length >= 24) throw new Error("busy");
	await new Promise<void>((resolve, reject) => {
		const next = () => {
			clearTimeout(timer);
			resolve();
		};
		const timer = setTimeout(() => {
			const index = waiting.indexOf(next);
			if (index >= 0) waiting.splice(index, 1);
			reject(new Error("busy"));
		}, 8000);
		waiting.push(next);
	});
}
function release() {
	const next = waiting.shift();
	if (next) next();
	else active--;
}
function allowed(url: URL) {
	return (
		url.protocol === "https:" &&
		!url.username &&
		!url.password &&
		!url.port &&
		hosts.has(url.hostname)
	);
}
function failure(status: number) {
	return new Response("Image unavailable", {
		status,
		headers: {
			"cache-control": "no-store",
			...(status === 503 ? { "retry-after": "5" } : {}),
		},
	});
}
function rasterType(bytes: Buffer) {
	if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
		return "image/jpeg";
	if (
		bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
	)
		return "image/png";
	if (
		bytes.toString("ascii", 0, 4) === "RIFF" &&
		bytes.toString("ascii", 8, 12) === "WEBP"
	)
		return "image/webp";
	if (["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6)))
		return "image/gif";
	if (
		bytes.toString("ascii", 4, 8) === "ftyp" &&
		bytes.toString("ascii", 8, 12) === "avif"
	)
		return "image/avif";
	throw new Error("format");
}

async function download(url: URL, signal: AbortSignal) {
	for (let redirects = 0; redirects <= 3; redirects++) {
		if (!allowed(url)) throw new Error("source");
		const response = await fetch(url, {
			headers: { "user-agent": "TakonbiniImageProxy/1.0" },
			redirect: "manual",
			signal,
		});
		if ([301, 302, 303, 307, 308].includes(response.status)) {
			await response.body?.cancel();
			const location = response.headers.get("location");
			if (!location || redirects === 3) throw new Error("redirect");
			url = new URL(location, url);
			continue;
		}
		if (!response.ok || !response.body) {
			await response.body?.cancel();
			throw new Error("upstream");
		}
		if (Number(response.headers.get("content-length")) > maxBytes) {
			await response.body.cancel();
			throw new Error("size");
		}
		const reader = response.body.getReader();
		const chunks: Uint8Array[] = [];
		let size = 0;
		try {
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				size += value.byteLength;
				if (size > maxBytes) throw new Error("size");
				chunks.push(value);
			}
		} catch (error) {
			await reader.cancel();
			throw error;
		} finally {
			reader.releaseLock();
		}
		return { bytes: Buffer.concat(chunks, size), headers: response.headers };
	}
	throw new Error("redirect");
}

export async function serveProductImage(request: Request) {
	const parameters = new URL(request.url).searchParams;
	const target = parameters.get("url");
	let url: URL;
	try {
		if (!target || target.length > 2048) return failure(400);
		url = new URL(target);
	} catch {
		return failure(400);
	}
	if (!allowed(url)) return failure(400);
	const widthText = parameters.get("w");
	const width = widthText === null ? undefined : Number(widthText);
	if (
		width !== undefined &&
		(!productImageWidths.some((item) => item === width) ||
			String(width) !== widthText)
	)
		return failure(400);
	if (
		[...parameters.keys()].some((key) => !["url", "w"].includes(key)) ||
		parameters.getAll("url").length !== 1 ||
		parameters.getAll("w").length > 1
	)
		return failure(400);
	try {
		await acquire();
	} catch {
		return failure(503);
	}
	const controller = new AbortController();
	const abort = () => controller.abort();
	request.signal.addEventListener("abort", abort, { once: true });
	if (request.signal.aborted) abort();
	const timer = setTimeout(abort, 10000);
	try {
		const upstream = await download(url, controller.signal);
		let bytes = upstream.bytes;
		let type = rasterType(bytes);
		let etag = upstream.headers.get("etag");
		if (width !== undefined) {
			const image = sharp(bytes, {
				limitInputPixels: maxPixels,
				failOn: "warning",
				animated: false,
			});
			const metadata = await image.metadata();
			if (
				!["jpeg", "png", "webp", "avif"].includes(metadata.format ?? "") ||
				(metadata.pages ?? 1) > 1
			)
				throw new Error("format");
			bytes = await image
				.rotate()
				.resize({
					width,
					height: width,
					fit: "inside",
					withoutEnlargement: true,
				})
				.webp({ quality: 80, effort: 2 })
				.timeout({ seconds: 2 })
				.toBuffer();
			if (bytes.length > maxBytes) throw new Error("size");
			type = "image/webp";
			etag = `"${createHash("sha256").update(bytes).digest("hex")}"`;
		}
		const headers = new Headers({
			"content-type": type ?? "application/octet-stream",
			"cache-control": cacheControl,
			"content-length": String(bytes.length),
			"x-content-type-options": "nosniff",
		});
		if (etag) headers.set("etag", etag);
		const modified = upstream.headers.get("last-modified");
		if (modified && width === undefined) headers.set("last-modified", modified);
		if (etag && request.headers.get("if-none-match") === etag) {
			headers.delete("content-length");
			return new Response(null, { status: 304, headers });
		}
		return new Response(new Uint8Array(bytes), { headers });
	} catch {
		return failure(502);
	} finally {
		clearTimeout(timer);
		request.signal.removeEventListener("abort", abort);
		release();
	}
}
