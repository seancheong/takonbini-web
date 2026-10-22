import type {
	ActiveCatalogProduct,
	CatalogPage,
	ProductFilters,
} from "../products.contracts";

export const CATALOG_PAGE_SIZE = 20;
export const RESIDENT_PAGES = 5;
export const MAX_PAGE_RECORDS = 512;
export const SESSION_BYTES = 256 * 1024;
export const SESSION_TTL = 30 * 60 * 1000;
export const SESSION_CONTEXTS = 3;
export const CATALOG_SESSION_KEY = "takonbini:catalog:v1";

export type PageRecord = {
	cursor?: string;
	count: number;
	nextCursor?: string;
};
export type BrowseAnchor = {
	id: string;
	index: number;
	offset: number;
	scrollY: number;
};
export type BrowseSession = {
	version: 1;
	key: string;
	entryKey: string;
	at: number;
	pages: PageRecord[];
	anchor: BrowseAnchor;
};

export function catalogWindowKey(filters: ProductFilters) {
	return JSON.stringify({
		...filters,
		limit: CATALOG_PAGE_SIZE,
		search: filters.search?.trim() || undefined,
		stores: filters.stores?.slice().sort(),
		categories: filters.categories?.slice().sort(),
		regions: filters.regions?.slice().sort(),
	});
}

export class CatalogWindow {
	pages: PageRecord[];
	private resident = new Map<number, CatalogPage>();
	constructor(
		private first: CatalogPage,
		records?: PageRecord[],
	) {
		this.pages = records?.length ? records.slice() : [this.record(first)];
	}
	private record(page: CatalogPage, cursor?: string): PageRecord {
		return { cursor, count: page.products.length, nextCursor: page.nextCursor };
	}
	reset() {
		this.pages = [this.record(this.first)];
		this.resident.clear();
	}
	get count() {
		return this.pages.reduce((sum, page) => sum + page.count, 0);
	}
	get hasNext() {
		return (
			Boolean(this.pages.at(-1)?.nextCursor) &&
			this.pages.length < MAX_PAGE_RECORDS
		);
	}
	get atCapacity() {
		return (
			this.pages.length === MAX_PAGE_RECORDS &&
			Boolean(this.pages.at(-1)?.nextCursor)
		);
	}
	get residentPageCount() {
		return 1 + this.resident.size;
	}
	get residentProductCount() {
		return (
			this.first.products.length +
			[...this.resident.values()].reduce((n, p) => n + p.products.length, 0)
		);
	}
	getPage(index: number) {
		return index === 0 ? this.first : this.resident.get(index);
	}
	locate(index: number) {
		let start = 0;
		for (let page = 0; page < this.pages.length; page++) {
			const end = start + this.pages[page].count;
			if (index < end) return { page, offset: index - start };
			start = end;
		}
		return undefined;
	}
	product(index: number) {
		const place = this.locate(index);
		return place ? this.getPage(place.page)?.products[place.offset] : undefined;
	}
	find(id: string): ActiveCatalogProduct | undefined {
		return (
			this.first.products.find((p) => p.id === id) ??
			[...this.resident.values()]
				.flatMap((p) => p.products)
				.find((p) => p.id === id)
		);
	}
	cursor(index: number) {
		if (index < this.pages.length) return this.pages[index].cursor;
		if (index === this.pages.length && this.hasNext)
			return this.pages.at(-1)?.nextCursor;
		throw new Error("Unknown catalog page");
	}
	put(index: number, page: CatalogPage, keep: number[] = []) {
		if (page.products.length > CATALOG_PAGE_SIZE)
			throw new Error("Oversized catalog page");
		const cursor = this.cursor(index);
		if (
			page.nextCursor &&
			(page.nextCursor === cursor ||
				this.pages.some((p, i) => i < index && p.cursor === page.nextCursor))
		)
			throw new Error("Repeated catalog cursor");
		const ids = new Set(page.products.map((p) => p.id));
		if (ids.size !== page.products.length)
			throw new Error("Duplicate catalog products");
		const previous = this.pages[index];
		if (
			previous &&
			(previous.count !== page.products.length ||
				previous.nextCursor !== page.nextCursor)
		)
			throw new Error("Catalog changed");
		if (!previous) this.pages.push(this.record(page, cursor));
		if (index === 0) {
			this.first = page;
			return;
		}
		this.resident.delete(index);
		this.resident.set(index, page);
		while (this.resident.size >= RESIDENT_PAGES) {
			const victim =
				[...this.resident.keys()].find(
					(key) => !keep.includes(key) && key !== index,
				) ?? this.resident.keys().next().value;
			if (victim === undefined) break;
			this.resident.delete(victim);
		}
	}
}

function validSession(
	value: unknown,
	now: number,
	includeExpired: boolean,
): value is BrowseSession {
	if (!value || typeof value !== "object") return false;
	const s = value as BrowseSession;
	return (
		s.version === 1 &&
		typeof s.key === "string" &&
		typeof s.entryKey === "string" &&
		Number.isFinite(s.at) &&
		now >= s.at &&
		(includeExpired || now - s.at <= SESSION_TTL) &&
		Array.isArray(s.pages) &&
		s.pages.length > 0 &&
		s.pages.length <= MAX_PAGE_RECORDS &&
		s.pages.every(
			(p, i) =>
				p &&
				Number.isInteger(p.count) &&
				p.count >= 0 &&
				p.count <= CATALOG_PAGE_SIZE &&
				(i === 0 ? p.cursor === undefined : typeof p.cursor === "string") &&
				(p.nextCursor === undefined || typeof p.nextCursor === "string"),
		) &&
		Boolean(s.anchor) &&
		typeof s.anchor.id === "string" &&
		Number.isInteger(s.anchor.index) &&
		s.anchor.index >= 0 &&
		s.anchor.index < s.pages.reduce((n, p) => n + p.count, 0) &&
		Number.isFinite(s.anchor.offset) &&
		Number.isFinite(s.anchor.scrollY) &&
		s.anchor.scrollY >= 0
	);
}

export function readBrowseSessions(
	storage: Pick<Storage, "getItem">,
	now = Date.now(),
	includeExpired = false,
): BrowseSession[] {
	try {
		const text = storage.getItem(CATALOG_SESSION_KEY);
		if (!text || new TextEncoder().encode(text).length > SESSION_BYTES)
			return [];
		const parsed: unknown = JSON.parse(text);
		return Array.isArray(parsed)
			? parsed
					.filter((s) => validSession(s, now, includeExpired))
					.slice(0, SESSION_CONTEXTS)
			: [];
	} catch {
		return [];
	}
}

export function saveBrowseSession(
	storage: Pick<Storage, "getItem" | "setItem">,
	session: BrowseSession,
) {
	try {
		const sessions = [
			session,
			...readBrowseSessions(storage).filter((s) => s.key !== session.key),
		].slice(0, SESSION_CONTEXTS);
		while (sessions.length) {
			const text = JSON.stringify(sessions);
			if (new TextEncoder().encode(text).length <= SESSION_BYTES) {
				storage.setItem(CATALOG_SESSION_KEY, text);
				return;
			}
			sessions.pop();
		}
		storage.setItem(CATALOG_SESSION_KEY, "[]");
	} catch {
		/* Browsing works without optional session storage. */
	}
}
