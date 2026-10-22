import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { Route } from "@/routes/__root";

afterEach(() => vi.unstubAllEnvs());

it.each(["/", "/products/one", "/products/two"])(
	"uses the leaf route path for a single canonical and Open Graph URL: %s",
	async (pathname) => {
		vi.stubEnv("SITE_URL", "http://wrong-client-environment.test");
		// Supply the context consumed by the head callback, independently of route loaders.
		const head = Route.options.head as (context: {
			match: { context: { i18n: { t: (key: string) => string } } };
			matches: { pathname: string }[];
			loaderData: { siteUrl: string };
		}) => {
			links: { rel: string; href: string }[];
			meta: { property?: string; content?: string }[];
		};
		const context = {
			match: {
				context: {
					queryClient: new QueryClient(),
					i18n: { t: (key: string) => key },
				},
			},
			matches: [{ pathname: "/" }, { pathname }],
			loaderData: { siteUrl: "https://takonbini.example.test/" },
		};
		const result = await head(context);
		const expected = `https://takonbini.example.test${pathname}${pathname === "/" ? "?lang=en" : ""}`;
		expect(result.links.filter((link) => link.rel === "canonical")).toEqual([
			{ rel: "canonical", href: expected },
		]);
		expect(result.meta.filter((meta) => meta.property === "og:url")).toEqual([
			{ property: "og:url", content: expected },
		]);
	},
);
