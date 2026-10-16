// @vitest-environment jsdom
import * as stylex from "@stylexjs/stylex";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/contexts/ThemeProvider";
import { darkTheme } from "@/styles/themes.stylex";

vi.mock("@tanstack/react-router", () => ({
	ScriptOnce: ({ children }: { children: ReactNode }) => (
		<script>{children}</script>
	),
}));
beforeEach(() => {
	document.documentElement.className = "";
	// biome-ignore lint/suspicious/noDocumentCookie: Isolate the real theme-cookie behavior.
	document.cookie = "theme-test=; Max-Age=0; Path=/";
	vi.stubGlobal("matchMedia", () => ({ matches: true }));
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});
function Controls() {
	const { setTheme } = useTheme();
	return (
		<>
			<button type="button" onClick={() => setTheme("dark")}>
				Dark
			</button>
			<button type="button" onClick={() => setTheme("light")}>
				Light
			</button>
		</>
	);
}
it("applies every compiled theme class and removes them when selecting light", () => {
	render(
		<ThemeProvider defaultTheme="light" cookieKey="theme-test">
			<Controls />
		</ThemeProvider>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Dark" }));
	const tokens = stylex.props(darkTheme).className?.split(/\s+/) ?? [];
	expect(tokens.length).toBeGreaterThan(0);
	for (const token of tokens)
		expect(document.documentElement.classList.contains(token)).toBe(true);
	fireEvent.click(screen.getByRole("button", { name: "Light" }));
	for (const token of tokens)
		expect(document.documentElement.classList.contains(token)).toBe(false);
	expect(document.documentElement.classList.contains("light")).toBe(true);
});
it("uses the system preference without passing a space-separated class to classList", () => {
	render(
		<ThemeProvider defaultTheme="system" cookieKey="theme-test">
			<span>System</span>
		</ThemeProvider>,
	);
	expect(document.documentElement.classList.contains("dark")).toBe(true);
});
it("serializes the compiled classes into the self-contained early theme script", () => {
	const html = renderToString(
		<ThemeProvider cookieKey="theme-test">
			<span>SSR</span>
		</ThemeProvider>,
	);
	expect(html).toContain("...darkThemeClasses");
	for (const token of stylex.props(darkTheme).className?.split(/\s+/) ?? [])
		expect(html).toContain(token);
});
