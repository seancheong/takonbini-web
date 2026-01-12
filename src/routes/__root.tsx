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
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import {
	type Theme,
	ThemeProvider,
	themeCookieKey,
} from "../contexts/ThemeProvider";
import i18n, { setSSRLanguage } from "../i18n";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const isTheme = (value: string | undefined): value is Theme =>
	value === "light" || value === "dark" || value === "system";

const loaderFn = createServerFn({ method: "GET" }).handler(async () => {
	const savedTheme = await getCookie(themeCookieKey);

	return { savedTheme };
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		// Set the SSR language before loading the route
		await setSSRLanguage();
	},
	loader: () => loaderFn(),
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
				name: "description",
				content: i18n.t("metaDescription"),
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
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/icon.svg",
			},
			{
				rel: "alternate icon",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				href: "/icon.png",
				sizes: "180x180",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
		],
	}),

	component: RootDocument,
});

function RootDocument() {
	const { i18n } = useTranslation();
	const { savedTheme } = Route.useLoaderData();
	const resolvedTheme = isTheme(savedTheme) ? savedTheme : "system";

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
		<html lang={i18n.language} suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>

			<body>
				<ThemeProvider defaultTheme={resolvedTheme} cookieKey={themeCookieKey}>
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
				</ThemeProvider>
			</body>
		</html>
	);
}
