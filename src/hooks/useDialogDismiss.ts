import { type RefObject, useEffect, useRef } from "react";

export function useDialogDismiss(
	dialog: RefObject<HTMLDialogElement | null>,
	exitDuration = 160,
) {
	const pending = useRef<(() => void) | null>(null);
	useEffect(() => () => pending.current?.(), []);

	return (onDismiss: () => void) => {
		if (pending.current) return;
		const element = dialog.current;
		if (
			!element ||
			document.documentElement.dataset.input === "keyboard" ||
			!window.matchMedia?.("(prefers-reduced-motion: no-preference)").matches
		) {
			onDismiss();
			return;
		}
		element.dataset.closing = "true";
		const finish = () => {
			cleanup();
			onDismiss();
		};
		const onEnd = (event: TransitionEvent) => {
			if (event.target === element && event.propertyName === "opacity")
				finish();
		};
		const timer = window.setTimeout(finish, exitDuration + 20);
		const cleanup = () => {
			window.clearTimeout(timer);
			element.removeEventListener("transitionend", onEnd);
			pending.current = null;
		};
		pending.current = cleanup;
		element.addEventListener("transitionend", onEnd);
	};
}
