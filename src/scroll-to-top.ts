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

export function animateScrollToTop(
	write: (offset: number) => void,
	onFinish: () => void,
) {
	const origin = window.scrollY;
	const duration = Math.min(900, 450 + origin / 12);
	let start: number | undefined;
	let frame = 0;
	let stopped = false;
	const stop = () => {
		if (stopped) return;
		stopped = true;
		cancelAnimationFrame(frame);
		for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
			window.removeEventListener(event, stop);
		}
		onFinish();
	};
	const step = (now: number) => {
		if (stopped) return;
		start ??= now;
		const progress = Math.min(1, (now - start) / duration);
		const eased = (1 - Math.cos(Math.PI * progress)) / 2;
		write(progress === 1 ? 0 : origin * (1 - eased));
		if (progress === 1) stop();
		else frame = requestAnimationFrame(step);
	};
	for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
		window.addEventListener(event, stop, { passive: true });
	}
	frame = requestAnimationFrame(step);
	return stop;
}
