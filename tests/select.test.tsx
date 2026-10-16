// @vitest-environment jsdom

import * as stylex from "@stylexjs/stylex";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

beforeAll(() => {
	HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

function Example({ disabled = false, onValueChange = vi.fn() }) {
	return (
		<Select defaultValue="en" onValueChange={onValueChange}>
			<SelectTrigger aria-label="Language" disabled={disabled}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent position="popper">
				<SelectItem value="en">English</SelectItem>
				<SelectItem value="zh" disabled>
					Chinese
				</SelectItem>
				<SelectItem value="ja">Japanese</SelectItem>
			</SelectContent>
		</Select>
	);
}

describe("compiled Select", () => {
	it("renders on the server with the existing default size and accessible label", () => {
		const html = renderToString(<Example />);
		expect(html).toContain('data-size="default"');
		expect(html).toContain('aria-label="Language"');
		expect(html).not.toContain('role="listbox"');
	});

	it("supports small, invalid and placeholder state without leaking StyleX props to the DOM", () => {
		render(
			<Select>
				<SelectTrigger
					size="sm"
					aria-label="Choose"
					aria-invalid
					xstyle={overrides.trigger}
					className="custom-select"
					style={{ width: 100 }}
				>
					<SelectValue placeholder="Choose language" />
				</SelectTrigger>
			</Select>,
		);
		const trigger = screen.getByRole("combobox");
		expect(trigger.getAttribute("data-size")).toBe("sm");
		expect(trigger.getAttribute("aria-invalid")).toBe("true");
		expect(trigger.hasAttribute("data-placeholder")).toBe(true);
		expect(trigger.hasAttribute("xstyle")).toBe(false);
		expect(trigger.classList.contains("custom-select")).toBe(true);
		expect(trigger.style.width).toBe("100px");
	});

	it("opens a portal with the keyboard, selects an enabled item and returns focus on Escape", async () => {
		const changed = vi.fn();
		const { container } = render(<Example onValueChange={changed} />);
		const trigger = screen.getByRole("combobox");
		fireEvent.keyDown(trigger, { key: "Enter" });
		const popup = await screen.findByRole("listbox");
		expect(container.contains(popup)).toBe(false);
		expect(
			screen
				.getByRole("option", { name: "Chinese" })
				.getAttribute("aria-disabled"),
		).toBe("true");
		const japanese = screen.getByRole("option", { name: "Japanese" });
		fireEvent.keyDown(japanese, { key: "Enter" });
		await waitFor(() => expect(changed).toHaveBeenCalledWith("ja"));
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
		fireEvent.keyDown(trigger, { key: "Enter" });
		await screen.findByRole("listbox");
		fireEvent.keyDown(screen.getByRole("option", { name: "Japanese" }), {
			key: "Escape",
		});
		await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
		await waitFor(() => expect(document.activeElement).toBe(trigger));
	});

	it("preserves dynamic StyleX variables when composing inline overrides", () => {
		render(
			<Select>
				<SelectTrigger
					aria-label="Dynamic"
					xstyle={overrides.width(180)}
					style={{ color: "inherit" }}
				>
					<SelectValue placeholder="Dynamic" />
				</SelectTrigger>
			</Select>,
		);
		const trigger = screen.getByRole("combobox");
		expect(trigger.getAttribute("style")).toContain("180px");
		expect(trigger.style.color).toBe("inherit");
	});

	it("renders the native disabled trigger state", () => {
		render(<Example disabled />);
		expect(screen.getByRole("combobox").hasAttribute("disabled")).toBe(true);
		expect(screen.queryByRole("listbox")).toBeNull();
	});
});

const overrides = stylex.create({
	width: (width: number) => ({ width }),
	trigger: { minHeight: "2.75rem", paddingInline: "0.5rem" },
});
