import * as stylex from "@stylexjs/stylex";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	retainSearchParams,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestUrl } from "@tanstack/react-start/server";
import { Analytics } from "@vercel/analytics/react";
import type { i18n as I18n } from "i18next";
import { type PropsWithChildren, useEffect } from "react";
import NavigationError, {
	NavigationPending,
} from "../components/NavigationError";
import { useTranslation } from "react-i18next";
import {
	type ActiveCatalogProduct,
	productQueries,
	productSharing,
} from "@/features/products/products";
import Header from "../components/Header";
import { StyleXDevStyles } from "../components/StyleXDevStyles";
import {
	type Theme,
	ThemeProvider,
	themeCookieKey,
} from "../contexts/ThemeProvider";
import { setSSRLanguage } from "../i18n";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import {
	documentLanguage,
	parseLocaleSearch,
	resolveSupportedLanguage,
} from "../localization";
import { darkTheme, themeStyles } from "../styles/themes.stylex";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	i18n: I18n;
}

const isTheme = (value: string | undefined): value is Theme =>
	value === "light" || value === "dark" || value === "system";

const loaderFn = createServerFn({ method: "GET" }).handler(async () => {
	const savedTheme = await getCookie(themeCookieKey);

	return {
		savedTheme,
		imageOrigin: getRequestUrl().origin,
		siteUrl: process.env.SITE_URL ?? "https://takonbini.com",
	};
});

export const Route = createRootRouteWithContext<MyRouterContext>()({
	validateSearch: parseLocaleSearch,
	search: { middlewares: [retainSearchParams(["lang"])] },
	beforeLoad: async ({ search, preload, context }) => {
		if (!preload) await setSSRLanguage(context.i18n, search.lang);
	},
	loader: () => loaderFn(),
	staleTime: Infinity,
	errorComponent: NavigationError,
	pendingComponent: NavigationPending,
	shellComponent: RootDocument,
	head: ({ match, matches, loaderData }) => {
		const { i18n } = match.context;
		const baseUrl = (loaderData?.siteUrl ?? "https://takonbini.com").replace(
			/\/$/,
			"",
		);
		const canonicalUrl = new URL(matches.at(-1)?.pathname ?? "/", `${baseUrl}/`)
			.href;

		const imageOrigin = loaderData?.imageOrigin ?? baseUrl;
		const siteTitle = i18n.t("appName");
		const productId = /^\/products\/([^/]+)\/?$/.exec(
			matches.at(-1)?.pathname ?? "",
		)?.[1];
		const product = productSharing(
			typeof productId === "string"
				? match.context.queryClient.getQueryData<ActiveCatalogProduct>(
						productQueries.detail(decodeURIComponent(productId)).queryKey,
					)
				: undefined,
			i18n.language,
			imageOrigin,
		);
		const title = product?.title
			? `${product.title} | ${siteTitle}`
			: siteTitle;
		const description = product?.description || i18n.t("metaDescription");
		const ogImage = product?.image ?? `${imageOrigin}/share-default.jpg`;
		const imageAlt = product?.image ? product.title || siteTitle : siteTitle;

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
					content: siteTitle,
				},
				{
					property: "og:url",
					content: canonicalUrl,
				},
				{
					property: "og:image",
					content: ogImage,
				},
				{ property: "og:image:alt", content: imageAlt },
				{
					property: "og:image:type",
					content: "image/jpeg",
				},
				...(!product?.image
					? [
							{ property: "og:image:width", content: "1200" },
							{ property: "og:image:height", content: "630" },
						]
					: []),
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
				{ name: "twitter:image", content: ogImage },
				{ name: "twitter:image:alt", content: imageAlt },
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
					href: canonicalUrl,
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
					href: "/manifest.json",
				},
			],
		};
	},

	component: Outlet,
});

function RootDocument({ children }: PropsWithChildren) {
	const { i18n } = useTranslation();
	const savedTheme = Route.useLoaderData()?.savedTheme;
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
			document.documentElement.lang = documentLanguage(
				resolveSupportedLanguage(i18n.language) ?? "en",
			);
		};

		i18n.on("languageChanged", handler);
		handler();

		return () => {
			i18n.off("languageChanged", handler);
		};
	}, [i18n]);

	return (
		<html
			lang={documentLanguage(resolveSupportedLanguage(i18n.language) ?? "en")}
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

					<main>{children}</main>

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
