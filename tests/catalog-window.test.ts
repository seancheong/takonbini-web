import { describe, expect, it } from "vitest";
import {
	type BrowseSession,
	CATALOG_SESSION_KEY,
	CatalogWindow,
	catalogWindowKey,
	readBrowseSessions,
	SESSION_TTL,
	saveBrowseSession,
} from "@/features/products/catalog/catalog-window";
import { catalogProduct } from "@/features/products/testing/catalog-fixtures";

const page = (n: number) => ({
	products: Array.from({ length: 20 }, (_, i) =>
		catalogProduct({ id: `${n}-${i}` }),
	),
	nextCursor: n < 59 ? `cursor-${n + 1}` : undefined,
});

describe("bounded browsing window", () => {
	it("walks 60 pages and revisits evicted pages without replaying preceding pages or growing payloads", () => {
		const window = new CatalogWindow(page(0));
		for (let i = 1; i < 60; i++) {
			expect(window.cursor(i)).toBe(`cursor-${i}`);
			window.put(i, page(i));
			expect(window.residentPageCount).toBeLessThanOrEqual(5);
			expect(window.residentProductCount).toBeLessThanOrEqual(100);
		}
		expect(window.hasNext).toBe(false);
		expect(window.getPage(1)).toBeUndefined();
		for (let i = 58; i > 0; i--) {
			const cursor = window.cursor(i);
			expect(cursor).toBe(`cursor-${i}`);
			window.put(i, page(i));
			expect(window.product(i * 20)?.id).toBe(`${i}-0`);
			expect(window.residentPageCount).toBeLessThanOrEqual(5);
		}
	});
	it("rejects oversized pages, duplicate products, cursor loops and changed reloads", () => {
		const window = new CatalogWindow(page(0));
		expect(() =>
			window.put(1, {
				...page(1),
				products: [...page(1).products, catalogProduct()],
			}),
		).toThrow("Oversized");
		expect(() =>
			window.put(1, {
				...page(1),
				products: [catalogProduct(), catalogProduct()],
			}),
		).toThrow("Duplicate");
		expect(() => window.put(1, { ...page(1), nextCursor: "cursor-1" })).toThrow(
			"Repeated",
		);
		window.put(1, page(1));
		expect(() => window.put(1, { ...page(1), nextCursor: "changed" })).toThrow(
			"changed",
		);
	});
	it("restores a deep directory and reads only its selected page", () => {
		const previous = new CatalogWindow(page(0));
		for (let i = 1; i < 50; i++) previous.put(i, page(i));
		const restored = new CatalogWindow(page(0), previous.pages);
		expect(restored.residentPageCount).toBe(1);
		expect(restored.locate(987)).toEqual({ page: 49, offset: 7 });
		restored.put(49, page(49));
		expect(restored.product(987)?.id).toBe("49-7");
		expect(restored.residentPageCount).toBe(2);
	});
});

function storage() {
	const entries = new Map<string, string>();
	return {
		getItem: (key: string) => entries.get(key) ?? null,
		setItem: (key: string, value: string) => {
			entries.set(key, value);
		},
	};
}
function session(key = "one"): BrowseSession {
	return {
		version: 1,
		key,
		entryKey: "entry",
		at: Date.now(),
		pages: [{ count: 20, nextCursor: "cursor-1" }],
		anchor: { id: "0-0", index: 0, offset: 100, scrollY: 400 },
	};
}
it("caps contexts, expires old anchors and tolerates corrupt, unavailable and oversized storage", () => {
	const store = storage();
	for (const key of ["one", "two", "three", "four"])
		saveBrowseSession(store, session(key));
	expect(readBrowseSessions(store).map((s) => s.key)).toEqual([
		"four",
		"three",
		"two",
	]);
	expect(readBrowseSessions(store, Date.now() + SESSION_TTL + 1000)).toEqual(
		[],
	);
	store.setItem(CATALOG_SESSION_KEY, "broken");
	expect(readBrowseSessions(store)).toEqual([]);
	store.setItem(CATALOG_SESSION_KEY, " ".repeat(256 * 1024 + 1));
	expect(readBrowseSessions(store)).toEqual([]);
	expect(
		readBrowseSessions({
			getItem: () => {
				throw new Error("denied");
			},
		}),
	).toEqual([]);
});
it("normalizes filter ordering and refuses malicious page-size overrides", () => {
	expect(catalogWindowKey({ limit: 1000, stores: [] })).toBe(
		catalogWindowKey({ limit: 20, stores: [] }),
	);
});
