import type {} from "@tanstack/react-router";

declare module "@tanstack/react-router" {
	interface HistoryState {
		fromCatalog?: boolean;
		catalogScrollY?: number;
	}
}
