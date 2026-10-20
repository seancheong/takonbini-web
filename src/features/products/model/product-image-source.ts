const hosts = new Set([
	"www.family.co.jp",
	"www.lawson.co.jp",
	"img-afd.7api-01.dp1.sej.co.jp",
	"www.sej.co.jp",
]);

export function isAllowedProductImageUrl(url: URL) {
	return (
		url.protocol === "https:" &&
		!url.username &&
		!url.password &&
		!url.port &&
		hosts.has(url.hostname)
	);
}

export function isAllowedProductImageSource(source: string) {
	if (source.length > 2048) return false;
	try {
		return isAllowedProductImageUrl(new URL(source));
	} catch {
		return false;
	}
}
