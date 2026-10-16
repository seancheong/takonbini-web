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
import ScrollTopButton from "@/components/ScrollTopButton";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

it("renders safely on the server before the scroll position is known", () => {
	expect(renderToString(<ScrollTopButton />)).toBe("");
});

it("reveals the compiled button on scroll and scrolls back to the top", () => {
	vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
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
