import type {} from "@tanstack/react-router";

declare module "@tanstack/react-router" {
	interface HistoryState {
		productModalId?: string;
		fromCatalog?: boolean;
		catalogScrollY?: number;
	}
}
