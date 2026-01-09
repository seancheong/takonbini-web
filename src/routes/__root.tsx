import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import "../i18n";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import { ThemeProvider, themeStorageKey } from "../contexts/ThemeProvider";
import i18n, { setSSRLanguage } from "../i18n";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		// Set the SSR language before loading the route
		await setSSRLanguage();
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: i18n.t("appName"),
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: RootDocument,
});

function RootDocument() {
	const { i18n } = useTranslation();

	useEffect(() => {
		const handler = () => {
			document.title = i18n.t("appName");
			document.documentElement.lang = i18n.language;
		};

		i18n.on("languageChanged", handler);
		handler();

		return () => {
			i18n.off("languageChanged", handler);
		};
	}, [i18n]);

	return (
		<html lang={i18n.language}>
			<head>
				<HeadContent />
			</head>
			<body>
				<Header />
				<main>
					<Outlet />
				</main>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
