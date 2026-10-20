import { QueryClient } from "@tanstack/react-query";
import { expect, it } from "vitest";
import { productQueries } from "@/features/products/products";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";
import { Route } from "@/routes/__root";

// This fixture supplies the fields consumed by head; compiled crawler checks exercise the full router context.
const head = Route.options.head as unknown as (context: {
	match: {
		context: {
			i18n: { language: string; t: (key: string) => string };
		};
	};
	matches: { pathname: string; routeId?: string; params?: { id: string } }[];
	loaderData: { siteUrl: string; imageOrigin?: string };
}) => {
	meta: {
		name?: string;
		property?: string;
		content?: string;
		title?: string;
	}[];
};
async function metadata(
	product: unknown,
	language = "en",
	imageOrigin?: string,
) {
	const queryClient = new QueryClient();
	queryClient.setQueryData(productQueries.detail("one").queryKey, product);
	const context = {
		match: {
			context: {
				queryClient,
				i18n: {
					language,
					t: (key: string) =>
						key === "appName" ? "Takonbini" : "Browse the catalog",
				},
			},
		},
		matches: [
			{ pathname: "/" },
			{
				pathname: "/products/one",
				routeId: "/products/$id",
				params: { id: "one" },
			},
		],
		loaderData: { siteUrl: "https://preview.example.test/", imageOrigin },
	};
	return head(context);
}
function values(result: Awaited<ReturnType<typeof metadata>>, key: string) {
	return result?.meta?.flatMap((meta) =>
		meta &&
		(("property" in meta && meta.property === key) ||
			("name" in meta && meta.name === key)) &&
		"content" in meta
			? [meta.content]
			: [],
	);
}
const product = catalogProduct({
	title: { en: "Rice ball", ja: "おにぎり", zh: "飯糰" },
	description: { en: "Salmon filling", ja: "鮭入り", zh: "鮭魚餡" },
	images: ["https://www.family.co.jp/photo.jpg"],
});
it.each([
	["en", "Rice ball", "Salmon filling"],
	["ja", "おにぎり", "鮭入り"],
	["zh", "飯糰", "鮭魚餡"],
])(
	"shares localized product content in %s",
	async (language, title, description) => {
		const result = await metadata(product, language);
		for (const key of ["og:title", "twitter:title"])
			expect(values(result, key)).toEqual([`${title} | Takonbini`]);
		for (const key of ["description", "og:description", "twitter:description"])
			expect(values(result, key)).toEqual([description]);
		expect(values(result, "og:image")).toEqual([
			"https://preview.example.test/api/share-image?url=https%3A%2F%2Fwww.family.co.jp%2Fphoto.jpg",
		]);
		expect(values(result, "twitter:image")).toEqual(values(result, "og:image"));
		expect(values(result, "og:image:alt")).toEqual([title]);
		expect(values(result, "og:image:width")).toEqual([]);
	},
);
it("resolves title and description fallbacks independently", async () => {
	const result = await metadata(
		{
			...product,
			title: { ja: "日本語", en: "English" },
			description: { ja: "説明", zh: "中文描述" },
		},
		"zh",
	);
	expect(values(result, "og:title")).toEqual(["日本語 | Takonbini"]);
	expect(values(result, "og:description")).toEqual(["中文描述"]);
});
it("distinguishes products and skips invalid photo sources", async () => {
	const result = await metadata({
		...product,
		title: { ja: "二", en: "Second" },
		images: [
			"javascript:alert(1)",
			"https://evil.test/a.png",
			"https://www.lawson.co.jp/second.png",
		],
	});
	expect(values(result, "og:title")).toEqual(["Second | Takonbini"]);
	expect(values(result, "og:image")).toEqual([
		"https://preview.example.test/api/share-image?url=https%3A%2F%2Fwww.lawson.co.jp%2Fsecond.png",
	]);
});
it.each([
	undefined,
	{ ...product, images: [] },
	{ ...product, images: ["http://www.family.co.jp/a.png"] },
])(
	"uses branded fallback for absent product or usable photo",
	async (input) => {
		const result = await metadata(input);
		expect(values(result, "og:image")).toEqual([
			"https://preview.example.test/share-default.jpg",
		]);
		expect(values(result, "og:image:width")).toEqual(["1200"]);
		expect(values(result, "og:image:height")).toEqual(["630"]);
	},
);
it("uses localized site description when the product has no description", async () => {
	const result = await metadata({ ...product, description: { ja: "" } });
	expect(values(result, "og:description")).toEqual(["Browse the catalog"]);
});

it("uses the deployment origin for images independently of canonical configuration", async () => {
	const result = await metadata(
		product,
		"en",
		"https://deployment.example.test",
	);
	expect(values(result, "og:image")).toEqual([
		"https://deployment.example.test/api/share-image?url=https%3A%2F%2Fwww.family.co.jp%2Fphoto.jpg",
	]);
	expect(values(result, "og:url")).toEqual([
		"https://preview.example.test/products/one",
	]);
	const missing = await metadata(
		undefined,
		"en",
		"https://deployment.example.test",
	);
	expect(values(missing, "og:image")).toEqual([
		"https://deployment.example.test/share-default.jpg",
	]);
});
