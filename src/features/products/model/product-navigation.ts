export const isSafari = () =>
	typeof navigator !== "undefined" &&
	/safari/i.test(navigator.userAgent) &&
	!/chrome|chromium|crios|fxios|edg|android/i.test(navigator.userAgent);
