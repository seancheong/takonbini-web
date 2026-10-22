import type { ParsedLocation } from "@tanstack/react-router";
import { expect, it } from "vitest";
import {
	getScrollRestorationKey,
	shouldRestoreScroll,
} from "@/scroll-restoration";

it("leaves catalog positioning to product anchors instead of competing router pixel restoration", () => {
	const location = {
		pathname: "/",
		search: {},
		state: {},
		href: "/",
	} as ParsedLocation;
	expect(shouldRestoreScroll({ location })).toBe(false);
	expect(getScrollRestorationKey(location)).toBe("catalog:{}");
	const detail = {
		...location,
		pathname: "/products/matcha",
		href: "/products/matcha",
		state: { __TSR_key: "detail-entry", __TSR_index: 1 },
	};
	expect(shouldRestoreScroll({ location: detail })).toBe(false);
	expect(getScrollRestorationKey(detail)).toBe("detail-entry");
});
