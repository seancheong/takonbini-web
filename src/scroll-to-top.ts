export const SCROLL_TO_TOP_EVENT = "takonbini:scroll-to-top";

export function scrollToTop() {
	const behavior: ScrollBehavior = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches
		? "instant"
		: "smooth";
	const request = new CustomEvent<ScrollBehavior>(SCROLL_TO_TOP_EVENT, {
		detail: behavior,
		cancelable: true,
	});
	if (window.dispatchEvent(request)) window.scrollTo({ top: 0, behavior });
}
