// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useDialogDismiss } from "@/hooks/useDialogDismiss";

function Dialog({ onDismiss }: { onDismiss: () => void }) {
	const dialog = useRef<HTMLDialogElement>(null);
	const dismiss = useDialogDismiss(dialog);
	return (
		<dialog open ref={dialog}>
			<button type="button" onClick={() => dismiss(onDismiss)}>
				Close
			</button>
		</dialog>
	);
}

afterEach(() => {
	cleanup();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	delete document.documentElement.dataset.input;
});

it("keeps the dialog present during exit and dismisses only once on transition completion", () => {
	vi.useFakeTimers();
	vi.stubGlobal("matchMedia", () => ({ matches: true }));
	const onDismiss = vi.fn();
	render(<Dialog onDismiss={onDismiss} />);
	fireEvent.click(screen.getByRole("button"));
	fireEvent.click(screen.getByRole("button"));
	expect(onDismiss).not.toHaveBeenCalled();
	expect(screen.getByRole("dialog").dataset.closing).toBe("true");
	fireEvent.transitionEnd(screen.getByRole("button"), {
		propertyName: "opacity",
	});
	expect(onDismiss).not.toHaveBeenCalled();
	fireEvent.transitionEnd(screen.getByRole("dialog"), {
		propertyName: "opacity",
	});
	expect(onDismiss).toHaveBeenCalledOnce();
	vi.runAllTimers();
	expect(onDismiss).toHaveBeenCalledOnce();
});

it("finishes dismissal even if the browser emits no transition event", () => {
	vi.useFakeTimers();
	vi.stubGlobal("matchMedia", () => ({ matches: true }));
	const onDismiss = vi.fn();
	render(<Dialog onDismiss={onDismiss} />);
	fireEvent.click(screen.getByRole("button"));
	vi.advanceTimersByTime(180);
	expect(onDismiss).toHaveBeenCalledOnce();
});

it.each(["reduced motion", "keyboard"])(
	"dismisses immediately for %s",
	(mode) => {
		vi.stubGlobal("matchMedia", () => ({ matches: mode !== "reduced motion" }));
		if (mode === "keyboard")
			document.documentElement.dataset.input = "keyboard";
		const onDismiss = vi.fn();
		render(<Dialog onDismiss={onDismiss} />);
		fireEvent.click(screen.getByRole("button"));
		expect(onDismiss).toHaveBeenCalledOnce();
	},
);

it("cancels pending dismissal when navigation unmounts the dialog", () => {
	vi.useFakeTimers();
	vi.stubGlobal("matchMedia", () => ({ matches: true }));
	const onDismiss = vi.fn();
	const view = render(<Dialog onDismiss={onDismiss} />);
	fireEvent.click(screen.getByRole("button"));
	view.unmount();
	vi.runAllTimers();
	expect(onDismiss).not.toHaveBeenCalled();
});
