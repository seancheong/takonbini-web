export const getProxiedImageUrl = (url: string) =>
	`/api/image?url=${encodeURIComponent(url)}`;
