import { useEffect, useRef } from "react";

const focusableSelector = [
	'button:not([disabled]):not([tabindex="-1"])',
	"[href]",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
].join(",");

export function useModalAccessibility(onDismiss: () => void) {
	const dialogRef = useRef<HTMLElement>(null);
	const dismissRef = useRef(onDismiss);
	dismissRef.current = onDismiss;

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		const opener =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const modalLayer =
			dialog.closest<HTMLElement>(".prototype-detail, .proto-filter-layer") ??
			dialog;
		const background = Array.from(modalLayer.parentElement?.children ?? [])
			.filter(
				(element): element is HTMLElement =>
					element instanceof HTMLElement && element !== modalLayer,
			)
			.map((element) => ({
				element,
				inert: element.hasAttribute("inert"),
				ariaHidden: element.getAttribute("aria-hidden"),
			}));
		for (const { element } of background) {
			element.setAttribute("inert", "");
			element.setAttribute("aria-hidden", "true");
		}

		const focusables = () =>
			Array.from(
				dialog.querySelectorAll<HTMLElement>(focusableSelector),
			).filter((element) => !element.hasAttribute("disabled"));

		const frame = requestAnimationFrame(() => {
			(
				dialog.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0]
			)?.focus();
		});

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				dismissRef.current();
				return;
			}
			if (event.key !== "Tab") return;

			const items = focusables();
			if (!items.length) {
				event.preventDefault();
				return;
			}
			const first = items[0];
			const last = items.at(-1);
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = previousOverflow;
			for (const { element, inert, ariaHidden } of background) {
				if (!inert) element.removeAttribute("inert");
				if (ariaHidden === null) element.removeAttribute("aria-hidden");
				else element.setAttribute("aria-hidden", ariaHidden);
			}
			opener?.focus();
		};
	}, []);

	return dialogRef;
}
