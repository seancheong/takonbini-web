import type {} from "@tanstack/react-router";

declare module "@tanstack/react-router" {
	interface HistoryState {
		restoreCatalog?: boolean;
		productModalId?: string;
		fromCatalog?: boolean;
		catalogScrollY?: number;
	}
}
