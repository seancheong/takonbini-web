import {
	Category,
	type PublicProduct,
	type Region,
	Store,
} from "@/@types/product";

/**
 * Synthetic, publication-safe catalog content for comparing prototype directions.
 *
 * None of these products, prices, release dates, observations, source URLs, or
 * images describe a real retailer listing. Do not seed production with this data.
 */

export type PrototypeObservation = {
	observedAt: string;
	freshness: "active" | "stale";
};

export type PrototypeCatalogFixture = {
	product: PublicProduct;
	observation: PrototypeObservation;
	coverage: readonly string[];
};

export type PrototypeListingState =
	| {
			kind: "results";
			products: PublicProduct[];
	  }
	| {
			kind: "empty-catalog" | "no-match";
			products: [];
	  }
	| {
			kind: "error";
			error: Error;
	  };

const DAY_IN_MS = 86_400_000;
const SYNTHETIC_SOURCE_ROOT = "https://catalog-fixture.example.invalid";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const daysFrom = (date: Date, days: number) =>
	new Date(date.getTime() + days * DAY_IN_MS);

const fixtureImage = (background: string, foreground: string, label: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#${background}"/><circle cx="400" cy="255" r="128" fill="#${foreground}" opacity=".14"/><circle cx="400" cy="255" r="82" fill="#${foreground}" opacity=".22"/><text x="400" y="455" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#${foreground}">${label}</text><text x="400" y="500" text-anchor="middle" font-family="sans-serif" font-size="16" letter-spacing="3" fill="#${foreground}">SYNTHETIC FIXTURE</text></svg>`,
	)}`;

const fixtureSource = (id: string) => `${SYNTHETIC_SOURCE_ROOT}/${id}`;

const allRegions: readonly Region[] = [
	"Hokkaido",
	"Tohoku",
	"Kanto",
	"Tokai",
	"Hokuriku",
	"Kansai",
	"ChugokuShikoku",
	"Kyushu",
	"Okinawa",
];

export const makeCatalogPrototypeFixtures = (
	now = new Date(),
): readonly PrototypeCatalogFixture[] => {
	const observedRecently = daysFrom(now, -3).toISOString();
	const observedStale = daysFrom(now, -35).toISOString();

	return [
		{
			product: {
				id: "fixture-seven-salt-onigiri",
				title: { ja: "塩むすび", en: "Salt Rice Ball", zh: "鹽飯糰" },
				price: 138,
				description: {
					ja: "試作比較用の架空の商品です。",
					en: "A fictional product for prototype comparison.",
					zh: "用於原型比較的虛構商品。",
				},
				images: [fixtureImage("f4ead8", "3d3328", "Synthetic rice ball")],
				url: fixtureSource("fixture-seven-salt-onigiri"),
				store: Store.SEVEN_ELEVEN,
				category: Category.ONIGIRI,
				regions: [...allRegions],
				isNew: true,
			},
			observation: { observedAt: observedRecently, freshness: "active" },
			coverage: ["short title", "new", "all regions", "low price"],
		},
		{
			product: {
				id: "fixture-lawson-long-parfait",
				title: {
					ja: "北海道ミルクと季節の果実を重ねた贅沢なクリームパフェ",
					en: "Layered Hokkaido Milk Cream Parfait with Seasonal Fruit",
					zh: "北海道牛奶奶油與季節水果豪華多層百匯",
				},
				price: 498,
				description: {
					ja: "長い商品名と画像なし状態を確認する架空の商品です。",
					en: "A fictional item for testing long titles and a missing image.",
					zh: "用於測試長標題與缺少圖片狀態的虛構商品。",
				},
				images: [],
				url: fixtureSource("fixture-lawson-long-parfait"),
				store: Store.LAWSON,
				category: Category.SWEETS,
				regions: ["Hokkaido", "Tohoku", "Kanto"],
			},
			observation: { observedAt: observedRecently, freshness: "active" },
			coverage: ["long title", "missing image", "regional", "high price"],
		},
		{
			product: {
				id: "fixture-family-future-sandwich",
				title: {
					ja: "彩り野菜サンド",
					en: "Garden Vegetable Sandwich",
					zh: "繽紛蔬菜三明治",
				},
				price: 328,
				description: {
					ja: "発売予定表示を確認する架空の商品です。",
					en: "A fictional item for checking the upcoming-release state.",
					zh: "用於檢查即將發售狀態的虛構商品。",
				},
				images: [fixtureImage("dcefe4", "194d35", "Synthetic sandwich")],
				url: fixtureSource("fixture-family-future-sandwich"),
				store: Store.FAMILY_MART,
				releaseDate: isoDate(daysFrom(now, 10)),
				category: Category.SANDWICH,
				regions: ["Tokai", "Hokuriku", "Kansai"],
			},
			observation: { observedAt: observedRecently, freshness: "active" },
			coverage: ["upcoming release", "medium title", "regional"],
		},
		{
			product: {
				id: "fixture-seven-unknown-price-tea",
				title: { ja: "香る緑茶", en: "Aromatic Green Tea", zh: "芳香綠茶" },
				price: 0,
				description: {
					ja: "価格不明表示を確認する架空の商品です。",
					en: "A fictional item for checking an unknown price.",
					zh: "用於檢查未知價格狀態的虛構商品。",
				},
				images: [fixtureImage("e5efdd", "245b2c", "Synthetic green tea")],
				url: fixtureSource("fixture-seven-unknown-price-tea"),
				store: Store.SEVEN_ELEVEN,
				category: Category.DRINK,
				regions: ["ChugokuShikoku", "Kyushu", "Okinawa"],
			},
			observation: { observedAt: observedRecently, freshness: "active" },
			coverage: ["unknown price", "regional"],
		},
		{
			product: {
				id: "fixture-lawson-bento",
				title: { ja: "彩り弁当", en: "Colorful Bento", zh: "繽紛便當" },
				price: 648,
				description: {
					ja: "価格帯の幅を確認する架空の商品です。",
					en: "A fictional item for checking a wider price range.",
					zh: "用於檢查更廣價格範圍的虛構商品。",
				},
				images: [fixtureImage("f5e2dc", "6f2f24", "Synthetic bento")],
				url: fixtureSource("fixture-lawson-bento"),
				store: Store.LAWSON,
				category: Category.BENTO,
				regions: ["Kanto", "Kansai", "Kyushu"],
			},
			observation: { observedAt: observedRecently, freshness: "active" },
			coverage: ["highest price", "multi-region", "standard release"],
		},
		{
			product: {
				id: "fixture-family-stale-noodles",
				title: { ja: "だし香る麺", en: "Dashi Noodles", zh: "高湯香麵" },
				price: 438,
				description: {
					ja: "古い観測の扱いを確認する架空の商品です。",
					en: "A fictional item for checking stale-observation handling.",
					zh: "用於檢查過期觀測處理方式的虛構商品。",
				},
				images: [fixtureImage("eee2cb", "5c4427", "Synthetic noodles")],
				url: fixtureSource("fixture-family-stale-noodles"),
				store: Store.FAMILY_MART,
				category: Category.NOODLE,
				regions: ["Kanto"],
			},
			observation: { observedAt: observedStale, freshness: "stale" },
			coverage: ["stale observation", "excluded from active results"],
		},
	];
};

export const makePrototypeListingStates = (
	now = new Date(),
): Record<
	"results" | "emptyCatalog" | "noMatch" | "error",
	PrototypeListingState
> => {
	const activeProducts = makeCatalogPrototypeFixtures(now)
		.filter(({ observation }) => observation.freshness === "active")
		.map(({ product }) => product);

	return {
		results: { kind: "results", products: activeProducts },
		emptyCatalog: { kind: "empty-catalog", products: [] },
		noMatch: { kind: "no-match", products: [] },
		error: {
			kind: "error",
			error: new Error("Synthetic catalog service failure"),
		},
	};
};
