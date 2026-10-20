import { readFile } from "node:fs/promises";
import sharp from "sharp";

const colors = await readFile(
	new URL("../src/styles/colors.stylex.ts", import.meta.url),
	"utf8",
);
function token(name) {
	const value = colors.match(new RegExp(`${name}: "(#[a-fA-F0-9]+)"`))?.[1];
	if (!value) throw new Error(`Expected a hex value for the ${name} token`);
	return value;
}
const logo = await readFile(
	new URL("../public/icon-green.svg", import.meta.url),
);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="${token("background")}"/>
<image x="180" y="220" width="180" height="180" xlink:href="data:image/svg+xml;base64,${logo.toString("base64")}"/>
<text x="410" y="315" font-family="Arial, sans-serif" font-size="96" font-weight="600" fill="${token("foreground")}">Takonbini</text>
<text x="415" y="375" font-family="Arial, sans-serif" font-size="32" fill="${token("primary")}">takonbini.com</text>
</svg>`;
await sharp(Buffer.from(svg))
	.jpeg({ quality: 90 })
	.toFile(new URL("../public/share-default.jpg", import.meta.url).pathname);
