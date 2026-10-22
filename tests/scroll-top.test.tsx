// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { SCROLL_TO_TOP_EVENT } from "@/scroll-to-top";
import ScrollTopButton from "@/components/ScrollTopButton";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("renders safely on the server before the scroll position is known", () => {
	expect(renderToString(<ScrollTopButton />)).toBe("");
});

it("reveals the compiled button on scroll and smoothly returns to the top", () => {
	vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
	vi.stubGlobal("matchMedia", () => ({ matches: false }));
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	render(<ScrollTopButton />);
	expect(screen.queryByRole("button")).toBeNull();

	vi.spyOn(window, "scrollY", "get").mockReturnValue(121);
	act(() => window.dispatchEvent(new Event("scroll")));
	const button = screen.getByRole("button", { name: "product.scrollTop" });
	expect(button.className).not.toBe("");
	fireEvent.click(button);
	expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

	vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
	act(() => window.dispatchEvent(new Event("scroll")));
	expect(screen.queryByRole("button")).toBeNull();
});

it("uses immediate scrolling when reduced motion is requested", () => {
	vi.spyOn(window, "scrollY", "get").mockReturnValue(200);
	vi.stubGlobal("matchMedia", () => ({ matches: true }));
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	render(<ScrollTopButton />);
	fireEvent.click(screen.getByRole("button", { name: "product.scrollTop" }));
	expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
});

it("lets the virtual catalog own smooth scrolling without a competing native write", () => {
	vi.spyOn(window, "scrollY", "get").mockReturnValue(200);
	vi.stubGlobal("matchMedia", () => ({ matches: false }));
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
	const handle = vi.fn((event: Event) => event.preventDefault());
	window.addEventListener(SCROLL_TO_TOP_EVENT, handle, { once: true });
	render(<ScrollTopButton />);
	fireEvent.click(screen.getByRole("button", { name: "product.scrollTop" }));
	expect(handle).toHaveBeenCalledOnce();
	expect(scrollTo).not.toHaveBeenCalled();
});
