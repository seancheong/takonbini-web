import type { ParsedLocation } from "@tanstack/react-router";
import { catalogSearch } from "./features/products/products";

export function getScrollRestorationKey(location: ParsedLocation): string {
	if (location.pathname === "/") {
		const filters = catalogSearch.encode(catalogSearch.parse(location.search));
		return `catalog:${JSON.stringify(filters)}`;
	}
	return location.state.__TSR_key || location.href;
}
