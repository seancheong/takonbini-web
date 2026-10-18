import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createElement } from "react";
import { I18nextProvider } from "react-i18next";
import { getRouterI18n } from "./i18n";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import {
	getScrollRestorationKey,
	shouldRestoreScroll,
} from "./scroll-restoration";

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();
	const i18n = getRouterI18n();

	const router = createRouter({
		routeTree,
		context: {
			...rqContext,
			i18n,
		},

		Wrap: ({ children }) => createElement(I18nextProvider, { i18n }, children),

		defaultPreload: "intent",
		scrollRestoration: shouldRestoreScroll,
		getScrollRestorationKey,
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	return router;
};
