export const productImageWidths = [320, 480, 640, 768, 960, 1280, 1600] as const;

export const getProxiedImageUrl = (url: string, width?: number) =>
	`/api/image?url=${encodeURIComponent(url)}${width ? `&w=${width}` : ""}`;

export const getProductImageSrcSet = (url: string) =>
	productImageWidths
		.map((width) => `${getProxiedImageUrl(url, width)} ${width}w`)
		.join(", ");

export const catalogImageSizes =
	"(max-width: 600px) calc(100vw - 40px), (max-width: 799px) calc((100vw - 108px) / 2), (max-width: 1232px) calc((100vw - 136px) / 3), 365px";
export const detailImageSizes =
	"(max-width: 1023px) calc(100vw - 32px), (max-width: 1184px) calc((100vw - 64px) * 0.6), 672px";
