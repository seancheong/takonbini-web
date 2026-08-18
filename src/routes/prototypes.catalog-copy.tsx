import { createFileRoute } from "@tanstack/react-router";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import ClearUtility from "@/features/product/prototypes/catalogCopy/ClearUtility";
import FriendlyDiscovery from "@/features/product/prototypes/catalogCopy/FriendlyDiscovery";
import WeeklyEditorial from "@/features/product/prototypes/catalogCopy/WeeklyEditorial";
import catalogDesignCss from "@/features/product/prototypes/catalogDesign/catalogDesign.css?url";
import localizationCss from "@/features/product/prototypes/catalogLocalization/catalogLocalization.css?url";
import type { PrototypeLocale } from "@/features/product/prototypes/catalogLocalization/localizationCopy";

export const Route = createFileRoute("/prototypes/catalog-copy")({
	component: CatalogCopyPrototype,
	validateSearch: (search) => {
		const candidate = Number(search.v);
		return {
			v:
				Number.isFinite(candidate) && candidate >= 1 && candidate <= 3
					? candidate
					: 1,
			lang:
				search.lang === "en" || search.lang === "ja" || search.lang === "zh"
					? (search.lang as PrototypeLocale)
					: undefined,
		};
	},
	head: () => ({
		meta: [{ title: "Catalog masthead copy exploration · Takonbini" }],
		links: [
			{ rel: "stylesheet", href: catalogDesignCss },
			{ rel: "stylesheet", href: localizationCss },
		],
	}),
});

const variants = [
	{ name: "Clear", component: ClearUtility },
	{ name: "Weekly", component: WeeklyEditorial },
	{ name: "Discovery", component: FriendlyDiscovery },
];

function CatalogCopyPrototype() {
	const { v, lang } = Route.useSearch();
	const [current, setCurrent] = useState(v - 1);
	const [currentLocale, setCurrentLocale] = useState<PrototypeLocale>(
		lang ?? "en",
	);
	const [mountKey, setMountKey] = useState(0);
	const pickerRef = useRef<HTMLElement>(null);
	const highlightRef = useRef<HTMLSpanElement>(null);
	const CurrentVariant = variants[current].component;

	useEffect(() => {
		setCurrent(v - 1);
	}, [v]);

	useEffect(() => {
		const syncLocale = (event: Event) => {
			setCurrentLocale((event as CustomEvent<PrototypeLocale>).detail);
		};
		window.addEventListener("takonbini:prototype-locale", syncLocale);
		return () =>
			window.removeEventListener("takonbini:prototype-locale", syncLocale);
	}, []);

	const moveHighlight = useCallback(() => {
		const picker = pickerRef.current;
		const highlight = highlightRef.current;
		const item = picker?.querySelectorAll<HTMLButtonElement>(
			".proto-picker-item:not(.proto-picker-replay)",
		)[current];
		if (!picker || !highlight || !item) return;
		highlight.style.width = `${item.offsetWidth}px`;
		highlight.style.transform = `translateX(${item.offsetLeft}px)`;
	}, [current]);

	const select = useCallback((index: number) => {
		if (index < 0 || index >= variants.length) return;
		setCurrent(index);
		setMountKey((value) => value + 1);
		const url = new URL(window.location.href);
		url.searchParams.set("v", String(index + 1));
		window.history.replaceState(null, "", url);
	}, []);

	useLayoutEffect(() => {
		moveHighlight();
		const frame = requestAnimationFrame(() =>
			requestAnimationFrame(() =>
				pickerRef.current?.setAttribute("data-ready", ""),
			),
		);
		window.addEventListener("resize", moveHighlight);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", moveHighlight);
		};
	}, [moveHighlight]);

	useLayoutEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement;
			if (
				/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
				target.isContentEditable
			)
				return;
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			const number = Number.parseInt(event.key, 10);
			if (number >= 1 && number <= variants.length) select(number - 1);
			else if (event.key === "ArrowRight")
				select((current + 1) % variants.length);
			else if (event.key === "ArrowLeft")
				select((current - 1 + variants.length) % variants.length);
			else if (event.key === "r" || event.key === "R")
				setMountKey((value) => value + 1);
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [current, select]);

	return (
		<div className="catalog-prototype-stage">
			<div key={`${current}-${mountKey}`}>
				<CurrentVariant initialLocale={currentLocale} />
			</div>
			<nav
				ref={pickerRef}
				className="proto-picker"
				aria-label="Prototype variants"
			>
				<span
					ref={highlightRef}
					className="proto-picker-highlight"
					aria-hidden="true"
				/>
				{variants.map((variant, index) => (
					<button
						key={variant.name}
						className="proto-picker-item"
						type="button"
						data-active={index === current || undefined}
						aria-current={index === current ? "true" : undefined}
						onClick={() => select(index)}
					>
						{variant.name}
					</button>
				))}
				<span className="proto-picker-divider" aria-hidden="true" />
				<button
					className="proto-picker-item proto-picker-replay"
					type="button"
					aria-label="Replay animation (R)"
					onClick={() => setMountKey((value) => value + 1)}
				>
					↻
				</button>
			</nav>
		</div>
	);
}
