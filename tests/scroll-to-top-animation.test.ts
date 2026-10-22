// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { animateScrollToTop } from "@/scroll-to-top";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("eases a long return over time and lands exactly at zero", () => {
	let frame: FrameRequestCallback | undefined;
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
		frame = callback;
		return 1;
	});
	vi.stubGlobal("cancelAnimationFrame", vi.fn());
	vi.spyOn(window, "scrollY", "get").mockReturnValue(4000);
	const write = vi.fn();
	const finish = vi.fn();
	animateScrollToTop(write, finish);
	frame?.(0);
	frame?.(200);
	expect(write.mock.lastCall?.[0]).toBeGreaterThan(2500);
	frame?.(1000);
	expect(write).toHaveBeenLastCalledWith(0);
	expect(finish).toHaveBeenCalledOnce();
});

it("yields to a wheel gesture instead of dragging the user to the top", () => {
	vi.stubGlobal(
		"requestAnimationFrame",
		vi.fn(() => 1),
	);
	const cancel = vi.fn();
	vi.stubGlobal("cancelAnimationFrame", cancel);
	const finish = vi.fn();
	animateScrollToTop(vi.fn(), finish);
	window.dispatchEvent(new Event("wheel"));
	expect(cancel).toHaveBeenCalledWith(1);
	expect(finish).toHaveBeenCalledOnce();
});
