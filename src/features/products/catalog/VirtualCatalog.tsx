import * as stylex from "@stylexjs/stylex";
import {
	defaultRangeExtractor,
	useWindowVirtualizer,
} from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
import { getProductsPage } from "../data/products-http-client";
import type {
	ActiveCatalogProduct,
	CatalogPage,
	ProductFilters,
} from "../products.contracts";
import {
	type BrowseAnchor,
	type BrowseSession,
	CatalogWindow,
	catalogWindowKey,
	readBrowseSessions,
	SESSION_TTL,
	saveBrowseSession,
} from "./catalog-window";
import ProductCard from "./ProductCard";
import ProductGrid from "./ProductGrid";

interface Props {
	firstPage: CatalogPage;
	filters: ProductFilters;
	onPreview: (product: ActiveCatalogProduct) => void;
	paused: boolean;
	entryKey?: string;
}

export default function VirtualCatalog({
	firstPage,
	filters,
	onPreview,
	paused,
	entryKey: catalogEntryKey,
}: Props) {
	const { t, i18n } = useTranslation();
	const [windowed] = useState(() => new CatalogWindow(firstPage));
	const [revision, setRevision] = useState(0);
	const [ready, setReady] = useState(false);
	const [visible, setVisible] = useState(true);
	const [columns, setColumns] = useState(1);
	const [margin, setMargin] = useState(0);
	const [width, setWidth] = useState(0);
	const [pending, setPending] = useState<number | null>(null);
	const [failure, setFailure] = useState<number | null>(null);
	const [notice, setNotice] = useState<
		"browseRestarted" | "browseMoved" | null
	>(null);
	const [manual, setManual] = useState(false);
	const [pinned, setPinned] = useState<number | null>(null);
	const [restoring, setRestoring] = useState(false);
	const root = useRef<HTMLElement>(null);
	const sentinel = useRef<HTMLDivElement>(null);
	const inFlight = useRef<{
		page: number;
		controller: AbortController;
		promise: Promise<boolean>;
	} | null>(null);
	const restoreAnchor = useRef<BrowseAnchor | null>(null);
	const triedRestore = useRef(false);
	const entryKey = useRef("");
	const lastAnchor = useRef<BrowseAnchor | null>(null);
	const reads = useRef(0);
	const key = catalogWindowKey(filters);
	const estimate = () => {
		const width = root.current?.clientWidth ?? 528;
		return (
			(width - (columns - 1) * 28) / columns / (columns === 1 ? 1 : 1.15) + 230
		);
	};
	const virtual = useWindowVirtualizer({
		count: Math.ceil(windowed.count / columns),
		estimateSize: estimate,
		overscan: 2,
		gap: columns === 1 ? 30 : 40,
		scrollMargin: margin,
		enabled: ready,
		rangeExtractor: (range) => {
			const rows = defaultRangeExtractor(range);
			return pinned === null || rows.includes(Math.floor(pinned / columns))
				? rows
				: [...rows, Math.floor(pinned / columns)].sort((a, b) => a - b);
		},
	});
	const rows = virtual.getVirtualItems();
	const visiblePages = [
		...new Set(
			rows.flatMap((row) =>
				Array.from(
					{ length: columns },
					(_, col) => windowed.locate(row.index * columns + col)?.page,
				).filter((p): p is number => p !== undefined),
			),
		),
	];
	const visibleKey = visiblePages.join(",");
	const load = useCallback(
		(page: number): Promise<boolean> => {
			if (inFlight.current)
				return inFlight.current.page === page
					? inFlight.current.promise
					: Promise.resolve(false);
			const controller = new AbortController();
			setPending(page);
			const promise = Promise.resolve().then(async () => {
				try {
					reads.current += 1;
					const data = await getProductsPage(
						windowed.cursor(page),
						{ ...filters, limit: 20 },
						controller.signal,
					);
					if (controller.signal.aborted) return false;
					windowed.put(
						page,
						data,
						visibleKey ? visibleKey.split(",").map(Number) : [],
					);
					setRevision((value) => value + 1);
					setFailure(null);
					return true;
				} catch {
					if (!controller.signal.aborted) setFailure(page);
					return false;
				} finally {
					if (inFlight.current?.controller === controller) {
						inFlight.current = null;
						setPending(null);
					}
				}
			});
			inFlight.current = { page, controller, promise };
			return promise;
		},
		[windowed, filters, visibleKey],
	);

	useEffect(() => {
		setReady(true);
		const visibility = () => setVisible(!document.hidden);
		visibility();
		document.addEventListener("visibilitychange", visibility);
		entryKey.current = window.history.state?.__TSR_key ?? "";
		try {
			setManual(sessionStorage.getItem("takonbini:manual-loading") === "true");
		} catch {
			/* Optional per-tab preference. */
		}
		const measure = () => {
			setColumns(
				window.innerWidth <= 600 ? 1 : window.innerWidth >= 800 ? 3 : 2,
			);
			if (root.current) {
				setWidth(root.current.clientWidth);
				setMargin(root.current.getBoundingClientRect().top + window.scrollY);
			}
		};
		measure();
		const observer =
			typeof ResizeObserver === "undefined"
				? undefined
				: new ResizeObserver(measure);
		if (root.current) observer?.observe(root.current);
		window.addEventListener("resize", measure);
		return () => {
			observer?.disconnect();
			document.removeEventListener("visibilitychange", visibility);
			window.removeEventListener("resize", measure);
			inFlight.current?.controller.abort();
		};
	}, []);

	useEffect(() => {
		if (!ready || triedRestore.current) return;
		triedRestore.current = true;
		let session: BrowseSession | undefined;
		try {
			session = readBrowseSessions(sessionStorage, Date.now(), true).find(
				(s) => s.key === key,
			);
		} catch {
			return;
		}
		const returning =
			(session?.entryKey &&
				session.entryKey === window.history.state?.__TSR_key) ||
			window.history.state?.restoreCatalog;
		if (!session || !returning) return;
		if (Date.now() - session.at > SESSION_TTL) {
			setNotice("browseRestarted");
			return;
		}
		if (
			session.pages[0].count !== firstPage.products.length ||
			session.pages[0].nextCursor !== firstPage.nextCursor
		) {
			setNotice("browseRestarted");
			return;
		}
		windowed.pages = session.pages;
		restoreAnchor.current = session.anchor;
		setRestoring(true);
		setRevision((value) => value + 1);
		const page = windowed.locate(session.anchor.index)?.page;
		if (page === undefined) return;
		void (page === 0 ? Promise.resolve(true) : load(page)).then((ok) => {
			const place = windowed.locate(session.anchor.index);
			const products = windowed.getPage(page)?.products;
			if (!ok || !place || !products?.length) {
				restoreAnchor.current = null;
				windowed.reset();
				setNotice("browseRestarted");
				setRestoring(false);
				setFailure(null);
				setRevision((value) => value + 1);
				return;
			}
			const found = products.findIndex(
				(product) => product.id === session.anchor.id,
			);
			const offset =
				found < 0 ? Math.min(place.offset, products.length - 1) : found;
			restoreAnchor.current = {
				...session.anchor,
				index: session.anchor.index - place.offset + offset,
				id: products[offset].id,
			};
			if (found < 0) setNotice("browseMoved");
			setRevision((value) => value + 1);
		});
	}, [ready, key, windowed, load, firstPage]);

	const rangeKey = rows.map((row) => row.index).join(",");
	const restoredProduct = restoreAnchor.current
		? windowed.product(restoreAnchor.current.index)
		: undefined;
	useEffect(() => {
		if (
			!restoring ||
			!restoreAnchor.current ||
			restoredProduct?.id !== restoreAnchor.current.id
		)
			return;
		const anchor = restoreAnchor.current;
		if (
			!rangeKey
				.split(",")
				.map(Number)
				.includes(Math.floor(anchor.index / columns))
		) {
			virtual.scrollToIndex(Math.floor(anchor.index / columns), {
				align: "start",
				behavior: "auto",
			});
			return;
		}
		let frame: number;
		let passes = 0;
		let stable = 0;
		const align = () => {
			if (!restoreAnchor.current) return;
			const card = root.current?.querySelector<HTMLElement>(
				`[data-product-index="${anchor.index}"]`,
			);
			if (!card?.querySelector("a[data-product-id]")) return;
			virtual.cancelScroll();
			const delta = card.getBoundingClientRect().top - anchor.offset;
			stable = Math.abs(delta) < 0.5 ? stable + 1 : 0;
			if (Math.abs(delta) >= 0.5)
				window.scrollBy({ top: delta, behavior: "instant" });
			passes++;
			if ((passes >= 6 && stable >= 2) || passes === 12) {
				restoreAnchor.current = null;
				setRestoring(false);
			} else frame = requestAnimationFrame(align);
		};
		frame = requestAnimationFrame(align);
		return () => cancelAnimationFrame(frame);
	}, [restoring, restoredProduct, rangeKey, columns, virtual]);

	useEffect(() => {
		if (!restoring) return;
		const cancel = () => {
			virtual.cancelScroll();
			restoreAnchor.current = null;
			setRestoring(false);
		};
		window.addEventListener("wheel", cancel, { passive: true });
		window.addEventListener("touchstart", cancel, { passive: true });
		window.addEventListener("pointerdown", cancel, { passive: true });
		const cancelKey = (event: KeyboardEvent) => {
			if (
				[
					"Tab",
					"ArrowUp",
					"ArrowDown",
					"PageUp",
					"PageDown",
					"Home",
					"End",
					" ",
				].includes(event.key)
			)
				cancel();
		};
		window.addEventListener("keydown", cancelKey);
		return () => {
			window.removeEventListener("wheel", cancel);
			window.removeEventListener("touchstart", cancel);
			window.removeEventListener("pointerdown", cancel);
			window.removeEventListener("keydown", cancelKey);
		};
	}, [restoring, virtual]);

	const missingPage = visiblePages.find((page) => !windowed.getPage(page));
	useEffect(() => {
		if (
			ready &&
			visible &&
			!paused &&
			!restoring &&
			failure === null &&
			pending === null &&
			missingPage !== undefined
		)
			void load(missingPage);
	}, [ready, visible, paused, restoring, failure, pending, missingPage, load]);

	const pageCount = windowed.pages.length;
	const hasNext = windowed.hasNext;

	useEffect(() => {
		if (
			!ready ||
			!visible ||
			!sentinel.current ||
			manual ||
			paused ||
			restoring ||
			failure !== null ||
			pending !== null ||
			!hasNext
		)
			return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries.some((entry) => entry.isIntersecting) &&
					!document.hidden &&
					!document.querySelector("dialog[open]")
				)
					void load(pageCount);
			},
			{ rootMargin: "600px" },
		);
		observer.observe(sentinel.current);
		return () => observer.disconnect();
	}, [
		ready,
		visible,
		manual,
		paused,
		restoring,
		failure,
		pending,
		pageCount,
		hasNext,
		load,
	]);

	useEffect(() => {
		if (!ready) return;
		if (catalogEntryKey) entryKey.current = catalogEntryKey;
		let timer: ReturnType<typeof setTimeout>;
		const save = () => {
			if (
				restoring ||
				restoreAnchor.current ||
				paused ||
				!triedRestore.current ||
				!root.current
			)
				return;
			const cards = [
				...root.current.querySelectorAll<HTMLElement>("[data-product-index]"),
			];
			const header =
				document
					.querySelector('[data-slot="sticky-filters"]')
					?.getBoundingClientRect().bottom ??
				document
					.querySelector('[data-slot="app-header"]')
					?.getBoundingClientRect().bottom ??
				0;
			const card = cards.find(
				(card) =>
					card.getBoundingClientRect().bottom > header &&
					card.querySelector("a[data-product-id]"),
			);
			const index = Number(card?.dataset.productIndex);
			const product = windowed.product(index);
			if (!card || !product) return;
			lastAnchor.current = {
				id: product.id,
				index,
				offset: card.getBoundingClientRect().top,
				scrollY: window.scrollY,
			};
			try {
				saveBrowseSession(sessionStorage, {
					version: 1,
					key,
					entryKey: entryKey.current,
					at: Date.now(),
					pages: windowed.pages,
					anchor: lastAnchor.current,
				});
			} catch {
				/* Optional session state. */
			}
		};
		const schedule = () => {
			clearTimeout(timer);
			timer = setTimeout(save, 120);
		};
		window.addEventListener("scroll", schedule, { passive: true });
		window.addEventListener("pagehide", save);
		save();
		return () => {
			clearTimeout(timer);
			save();
			window.removeEventListener("scroll", schedule);
			window.removeEventListener("pagehide", save);
		};
	}, [ready, restoring, paused, key, windowed, catalogEntryKey]);

	const geometryKey = `${columns}:${width}:${i18n.language}`;
	const measuredGeometry = useRef({ key: geometryKey, columns });
	useEffect(() => {
		if (measuredGeometry.current.key !== geometryKey) {
			virtual.cancelScroll();
			if (measuredGeometry.current.columns !== columns) virtual.measure();
			measuredGeometry.current = { key: geometryKey, columns };
			if (lastAnchor.current) {
				restoreAnchor.current = lastAnchor.current;
				setRestoring(true);
			}
		}
	}, [geometryKey, columns, virtual]);

	const restart = () => {
		inFlight.current?.controller.abort();
		inFlight.current = null;
		windowed.reset();
		restoreAnchor.current = null;
		setRestoring(false);
		setPending(null);
		setFailure(null);
		setPinned(null);
		setNotice(null);
		setRevision((value) => value + 1);
		window.scrollTo({ top: 0, behavior: "instant" });
	};
	const moveFocus = async (index: number) => {
		if (index < 0 || index >= windowed.count) return;
		const page = windowed.locate(index)?.page;
		if (page !== undefined && !windowed.getPage(page) && !(await load(page)))
			return;
		setPinned(index);
		virtual.scrollToIndex(Math.floor(index / columns), { align: "auto" });
		requestAnimationFrame(() =>
			root.current
				?.querySelector<HTMLAnchorElement>(
					`[data-product-index="${index}"] a[data-product-id]`,
				)
				?.focus(),
		);
	};
	return (
		<>
			{notice && <output>{t(`product.${notice}`)}</output>}
			<label {...stylex.props(styles.manual)}>
				<input
					type="checkbox"
					checked={manual}
					onChange={(event) => {
						setManual(event.target.checked);
						try {
							sessionStorage.setItem(
								"takonbini:manual-loading",
								String(event.target.checked),
							);
						} catch {}
					}}
				/>
				{t("product.manualLoading")}
			</label>
			<section
				ref={root}
				aria-label={t("product.results")}
				data-revision={revision}
				data-page-reads={reads.current}
				data-slot="virtual-catalog"
				data-resident-pages={windowed.residentPageCount}
				data-resident-products={windowed.residentProductCount}
				data-known-pages={windowed.pages.length}
				onBlurCapture={(event) => {
					if (
						!paused &&
						!(
							event.relatedTarget instanceof Node &&
							event.currentTarget.contains(event.relatedTarget)
						)
					)
						setPinned(null);
				}}
				onFocusCapture={(event) => {
					const card = (event.target as HTMLElement).closest<HTMLElement>(
						"[data-product-index]",
					);
					if (card) setPinned(Number(card.dataset.productIndex));
				}}
				onKeyDown={(event) => {
					if (
						event.key !== "Tab" ||
						event.altKey ||
						event.metaKey ||
						event.ctrlKey
					)
						return;
					const card = (event.target as HTMLElement).closest<HTMLElement>(
						"[data-product-index]",
					);
					if (!card) return;
					const index =
						Number(card.dataset.productIndex) + (event.shiftKey ? -1 : 1);
					if (index >= 0 && index < windowed.count) {
						event.preventDefault();
						void moveFocus(index);
					}
				}}
			>
				{!ready ? (
					<ProductGrid
						products={firstPage.products}
						filters={filters}
						onPreview={onPreview}
					/>
				) : (
					<div
						style={{ height: virtual.getTotalSize(), position: "relative" }}
						aria-busy={restoring}
					>
						{rows.map((row) => (
							<div
								key={row.key}
								data-index={row.index}
								ref={virtual.measureElement}
								{...stylex.props(styles.row)}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									transform: `translateY(${row.start - margin}px)`,
								}}
							>
								{Array.from({ length: columns }, (_, col) => {
									const index = row.index * columns + col;
									if (index >= windowed.count) return null;
									const product = windowed.product(index);
									return (
										<div key={product?.id ?? index} data-product-index={index}>
											{product ? (
												<ProductCard
													product={product}
													filters={filters}
													imagePriority={index === 0}
													onPreview={(product) => {
														setPinned(index);
														onPreview(product);
													}}
												/>
											) : (
												<div
													aria-hidden="true"
													{...stylex.props(styles.placeholder)}
													style={{ height: estimate() }}
												/>
											)}
										</div>
									);
								})}
							</div>
						))}
					</div>
				)}
			</section>
			<div ref={sentinel} {...stylex.props(styles.pagination)}>
				<output aria-live="polite">
					{restoring
						? t("product.restoringBrowse")
						: pending !== null
							? t("product.loadingMore")
							: t("product.loadedCount", { count: windowed.count })}
				</output>
				{failure !== null ? (
					<div role="alert">
						<p>{t("product.error")}</p>
						<button
							type="button"
							{...stylex.props(styles.action)}
							onClick={() => {
								setFailure(null);
								void load(failure);
							}}
						>
							{t("product.retry")}
						</button>
						<button
							type="button"
							{...stylex.props(styles.action)}
							onClick={restart}
						>
							{t("product.restartBrowse")}
						</button>
					</div>
				) : windowed.hasNext ? (
					<button
						type="button"
						{...stylex.props(styles.action)}
						disabled={pending !== null || restoring}
						onClick={() => void load(windowed.pages.length)}
					>
						{t("product.loadMore")}
					</button>
				) : (
					<p>
						{t(windowed.atCapacity ? "product.browseCapacity" : "product.end")}
					</p>
				)}
				{windowed.atCapacity && (
					<button
						type="button"
						{...stylex.props(styles.action)}
						onClick={restart}
					>
						{t("product.restartBrowse")}
					</button>
				)}
			</div>
		</>
	);
}

const styles = stylex.create({
	row: {
		display: "grid",
		gridTemplateColumns: {
			default: "repeat(2,minmax(0,1fr))",
			[conditions.compactCatalog]: "minmax(0,1fr)",
			[conditions.tabletGrid]: "repeat(3,minmax(0,1fr))",
		},
		gap: { default: "0 28px", [conditions.compactCatalog]: "0 18px" },
	},
	placeholder: { backgroundColor: colors.muted, borderRadius: "8px" },
	pagination: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "16px",
		paddingBlock: "16px",
		color: colors.mutedForeground,
		fontSize: "14px",
	},
	manual: {
		minHeight: "44px",
		display: "flex",
		alignItems: "center",
		gap: "10px",
		cursor: "pointer",
	},
	action: {
		minHeight: "44px",
		padding: "10px 16px",
		border: "1px solid",
		borderColor: colors.border,
		borderRadius: "6px",
		backgroundColor: { default: colors.card, ":hover": colors.muted },
		color: colors.foreground,
		cursor: "pointer",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
		opacity: { default: null, ":disabled": 0.5 },
	},
});
