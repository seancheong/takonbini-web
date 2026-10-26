import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

process.env.PRODUCTS_API_URL = "https://catalog.example.test";
process.env.PRODUCTS_API_KEY = "synthetic";
const product = {
 id: "00000000000000000000000000000001",
 title: { en: "Product", ja: "商品", zh: "商品中文" },
 description: { en: "Description", ja: "説明", zh: "描述" },
 images: [], store: "Lawson", price: 100, url: "https://example.test/product",
};
globalThis.fetch = async (input) => {
 const url = new URL(input instanceof Request ? input.url : input);
 assert.equal(url.origin, "https://catalog.example.test");
 if (url.pathname.endsWith("/missing")) return Response.json({}, { status: 404 });
 if (url.pathname === "/products" || url.pathname === "/products/discovery")
  return Response.json({ products: [product] });
 return Response.json(product);
};
const assets = resolve(".vercel/output/static/assets");
const cssFiles = (await readdir(assets)).filter((file) => file.endsWith(".css"));
assert.equal(cssFiles.length, 1, "review the inline CSS budget if the build gains another stylesheet");
const compiledCss = (await readFile(resolve(assets, cssFiles[0]), "utf8")).trim();
assert.ok(Buffer.byteLength(compiledCss) < 64 * 1024, "inline CSS remains below 64 KiB before compression");
const app = (await import(pathToFileURL(resolve(".vercel/output/functions/__server.func/index.mjs")))).default;
for (const lang of ["en", "ja", "zh"]) {
 for (const [path, status] of [["/", 200], ["/browse", 200], [`/products/${product.id}`, 200], ["/products/missing", 404]]) {
  const response = await app.fetch(new Request(`https://web.example.test${path}?lang=${lang}`));
  assert.equal(response.status, status);
  const html = await response.text();
  const dom = new JSDOM(html);
  const styles = dom.window.document.querySelectorAll("head style[data-tsr-inline-css]");
  assert.equal(styles.length, 1, `${path}/${lang}: compiled CSS is in the first-response head`);
  assert.equal(styles[0].textContent.trim(), compiledCss, `${path}/${lang}: all generated StyleX and global CSS is preserved`);
  assert.equal(dom.window.document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"]').length, 0, `${path}/${lang}: no stylesheet round trip blocks first paint`);
  assert.ok(dom.window.document.querySelector("h1"), `${path}/${lang}: readable SSR content`);
  dom.window.close();
 }
}
console.log("Inline styles: complete compiled CSS, no blocking stylesheet, bounded bytes and SSR content pass for 12 locale/route cases.");
