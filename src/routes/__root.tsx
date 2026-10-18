import * as stylex from "@stylexjs/stylex";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { darkTheme, themeStyles } from "../styles/themes.stylex";
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
import { StyleXDevStyles } from "../components/StyleXDevStyles";
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
	head: () => {
		const baseUrl = process.env.SITE_URL ?? "http://localhost:3000";

		const title = i18n.t("appName");
		const description = i18n.t("metaDescription");
		const ogImage = `${baseUrl}/og.png`;

		return {
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
					content: description,
				},
				{
					name: "robots",
					content: "index, follow",
				},
				{
					property: "og:title",
					content: title,
				},
				{
					property: "og:description",
					content: description,
				},
				{
					property: "og:type",
					content: "website",
				},
				{
					property: "og:site_name",
					content: title,
				},
				{
					property: "og:url",
					content: baseUrl,
				},
				{
					property: "og:image",
					content: ogImage,
				},
				{
					property: "og:image:width",
					content: "1200",
				},
				{
					property: "og:image:height",
					content: "630",
				},
				{
					name: "twitter:card",
					content: "summary_large_image",
				},
				{
					name: "twitter:title",
					content: title,
				},
				{
					name: "twitter:description",
					content: description,
				},
				{
					name: "twitter:image",
					content: ogImage,
				},
				{
					title,
				},
			],
			links: [
				{
					rel: "stylesheet",
					href: appCss,
				},
				{
					rel: "canonical",
					href: baseUrl,
				},
				{
					rel: "icon",
					type: "image/svg+xml",
					href: "/icon.svg?v=green",
				},
				{
					rel: "alternate icon",
					href: "/favicon.ico?v=green",
					type: "image/x-icon",
				},
				{
					rel: "apple-touch-icon",
					href: "/icon.png?v=green",
					sizes: "180x180",
				},
				{
					rel: "manifest",
					href: "/site.webmanifest",
				},
			],
		};
	},

	component: RootDocument,
});

function RootDocument() {
	const { i18n } = useTranslation();
	const { savedTheme } = Route.useLoaderData();
	const resolvedTheme = isTheme(savedTheme) ? savedTheme : "system";

	useEffect(() => {
		const root = document.documentElement;
		const keyboard = () => {
			root.dataset.input = "keyboard";
		};
		const pointer = () => {
			delete root.dataset.input;
		};
		document.addEventListener("keydown", keyboard, true);
		document.addEventListener("pointerdown", pointer, true);
		return () => {
			document.removeEventListener("keydown", keyboard, true);
			document.removeEventListener("pointerdown", pointer, true);
			delete root.dataset.input;
		};
	}, []);

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
		<html
			lang={i18n.language}
			{...stylex.props(
				themeStyles.bridge,
				resolvedTheme === "dark" && darkTheme,
			)}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
				<StyleXDevStyles />
			</head>

			<body>
				<ThemeProvider defaultTheme={resolvedTheme} cookieKey={themeCookieKey}>
					<Header />

					<main>
						<Outlet />
					</main>

					<TanStackDevtools
						config={{
							position: "bottom-left",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
					{import.meta.env.PROD ? <Analytics /> : null}
					<Scripts />
				</ThemeProvider>
			</body>
		</html>
	);
}
