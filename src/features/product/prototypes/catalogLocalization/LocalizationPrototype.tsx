import {
	Check,
	Globe2,
	Moon,
	Search,
	SlidersHorizontal,
	Sun,
	X,
} from "lucide-react";
import {
	type Dispatch,
	type SetStateAction,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import type { PublicProduct } from "@/@types/product";
import {
	filterCount,
	initialPrototypeFilters,
	type PrototypeFilters,
} from "../catalogDesign/PrototypeFilterSheet";
import { prototypeProducts } from "../catalogDesign/prototypeData";
import { useModalAccessibility } from "../catalogDesign/useModalAccessibility";
import {
	formatPrototypePrice,
	localeNames,
	localizationCopy,
	localizedCategories,
	localizedStores,
	type PrototypeLocale,
	resolvePrototypeText,
} from "./localizationCopy";

export type LocalizationMode = "direct" | "editions" | "sheet";
export type PrototypeMastheadCopy = Record<
	PrototypeLocale,
	{ headline: string; intro: string }
>;

const productsWithFallback = prototypeProducts.map((product, index) =>
	index === 3
		? {
				...product,
				title: { ja: product.title.ja },
				description: { ja: product.description.ja },
			}
		: product,
);

const storeOptions = ["SevenEleven", "Lawson", "FamilyMart"] as const;
const categoryOptions = ["Onigiri", "Sweets", "Sandwich", "Drink"];
const localeOptions: PrototypeLocale[] = ["en", "ja", "zh"];

function filterLocalizationProducts(
	products: readonly PublicProduct[],
	query: string,
	filters: PrototypeFilters,
) {
	const needle = query.trim().toLocaleLowerCase();
	return products.filter((product) => {
		const searchable = [
			product.title.en,
			product.title.ja,
			product.title.zh,
			product.category,
			product.store,
		]
			.filter(Boolean)
			.join(" ")
			.toLocaleLowerCase();
		return (
			(!needle || searchable.includes(needle)) &&
			(filters.stores.length === 0 || filters.stores.includes(product.store)) &&
			(filters.categories.length === 0 ||
				(product.category !== undefined &&
					filters.categories.includes(product.category))) &&
			(product.price === 0 || product.price <= filters.maxPrice)
		);
	});
}

function resolveInitialLocale(): PrototypeLocale {
	if (typeof window === "undefined") return "en";
	const urlLocale = new URL(window.location.href).searchParams.get("lang");
	if (urlLocale === "en" || urlLocale === "ja" || urlLocale === "zh")
		return urlLocale;
	const stored = localStorage.getItem("takonbini-prototype-locale");
	if (stored === "en" || stored === "ja" || stored === "zh") return stored;
	const browserLocale = navigator.language.toLowerCase();
	if (browserLocale.startsWith("ja")) return "ja";
	if (browserLocale.startsWith("zh")) return "zh";
	return "en";
}

function LocaleSelect({
	locale,
	onChange,
}: {
	locale: PrototypeLocale;
	onChange: (locale: PrototypeLocale) => void;
}) {
	return (
		<label className="loc-compact-select">
			<Globe2 aria-hidden="true" />
			<span className="sr-only">{localizationCopy[locale].language}</span>
			<select
				value={locale}
				onChange={(event) => onChange(event.target.value as PrototypeLocale)}
			>
				{localeOptions.map((candidate) => (
					<option key={candidate} value={candidate}>
						{localeNames[candidate]}
					</option>
				))}
			</select>
		</label>
	);
}

function LocalizedFilterSheet({
	locale,
	draft,
	setDraft,
	onApply,
	onClose,
}: {
	locale: PrototypeLocale;
	draft: PrototypeFilters;
	setDraft: Dispatch<SetStateAction<PrototypeFilters>>;
	onApply: () => void;
	onClose: () => void;
}) {
	const [open, setOpen] = useState(true);
	const copy = localizationCopy[locale];
	const requestClose = () => setOpen(false);
	const dialogRef = useModalAccessibility(requestClose);

	return (
		<div className="proto-filter-layer" data-state={open ? "open" : "closed"}>
			<button
				type="button"
				className="proto-filter-backdrop"
				aria-label={copy.closeFilters}
				onClick={requestClose}
				tabIndex={-1}
			/>
			<section
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label={copy.filterDialog}
				className="proto-filter-sheet loc-filter-sheet"
				data-state={open ? "open" : "closed"}
				onTransitionEnd={(event) => {
					if (event.target === event.currentTarget && !open) onClose();
				}}
			>
				<header>
					<div>
						<span>{copy.filters}</span>
						<h2>{copy.refine}</h2>
					</div>
					<button
						type="button"
						onClick={requestClose}
						aria-label={copy.close}
						data-autofocus
					>
						<X />
					</button>
				</header>
				<fieldset>
					<legend>{copy.store}</legend>
					<div className="proto-filter-options">
						{storeOptions.map((store) => (
							<label key={store}>
								<input
									type="checkbox"
									checked={draft.stores.includes(store)}
									onChange={() =>
										setDraft((current) => ({
											...current,
											stores: current.stores.includes(store)
												? current.stores.filter((item) => item !== store)
												: [...current.stores, store],
										}))
									}
								/>
								{localizedStores[locale][store]}
							</label>
						))}
					</div>
				</fieldset>
				<fieldset>
					<legend>{copy.craving}</legend>
					<div className="proto-filter-categories">
						{categoryOptions.map((category) => (
							<label key={category}>
								<input
									type="checkbox"
									checked={draft.categories.includes(category)}
									onChange={() =>
										setDraft((current) => ({
											...current,
											categories: current.categories.includes(category)
												? current.categories.filter((item) => item !== category)
												: [...current.categories, category],
										}))
									}
								/>
								{localizedCategories[locale][category]}
							</label>
						))}
					</div>
				</fieldset>
				<label className="proto-filter-price">
					{copy.maximumPrice} · ¥{draft.maxPrice.toLocaleString(locale)}
					<input
						type="range"
						min="100"
						max="1000"
						step="50"
						value={draft.maxPrice}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								maxPrice: Number(event.target.value),
							}))
						}
					/>
				</label>
				<button
					className="proto-filter-apply"
					type="button"
					onClick={() => {
						onApply();
						requestClose();
					}}
				>
					{copy.showProducts}
				</button>
			</section>
		</div>
	);
}

function ProductDialog({
	product,
	locale,
	onClosed,
}: {
	product: PublicProduct;
	locale: PrototypeLocale;
	onClosed: () => void;
}) {
	const [open, setOpen] = useState(true);
	const copy = localizationCopy[locale];
	const title = resolvePrototypeText(product.title, locale);
	const description = resolvePrototypeText(product.description, locale);
	const requestClose = () => setOpen(false);
	const dialogRef = useModalAccessibility(requestClose);

	return (
		<div
			className="prototype-detail"
			data-state={open ? "open" : "closed"}
			role="dialog"
			aria-modal="true"
			aria-label={title.text}
			ref={dialogRef}
		>
			<button
				className="prototype-detail-backdrop"
				type="button"
				onClick={requestClose}
				aria-label={copy.closeDetails}
				tabIndex={-1}
			/>
			<article
				className="shiori-detail loc-product-detail"
				data-state={open ? "open" : "closed"}
				onTransitionEnd={(event) => {
					if (event.target === event.currentTarget && !open) onClosed();
				}}
			>
				<button
					className="detail-close"
					type="button"
					onClick={requestClose}
					aria-label={copy.close}
					data-autofocus
				>
					<X />
				</button>
				<div className="shiori-detail-image">
					{product.images[0] ? (
						<img src={product.images[0]} alt={title.text} />
					) : (
						<span>{copy.noImage}</span>
					)}
				</div>
				<section>
					<p className={`store-ink store-${product.store}`}>
						{localizedStores[locale][product.store]} ·{` `}
						{product.category
							? (localizedCategories[locale][product.category] ??
								product.category)
							: ""}
					</p>
					{title.fallback ? (
						<span className="loc-fallback-note">{copy.fallback}</span>
					) : null}
					<h2 lang={title.language}>{title.text}</h2>
					<p lang={description.language}>{description.text}</p>
					<strong>{formatPrototypePrice(product.price, locale)}</strong>
				</section>
			</article>
		</div>
	);
}

function LanguageChooser({
	locale,
	onApply,
	onClose,
}: {
	locale: PrototypeLocale;
	onApply: (locale: PrototypeLocale) => void;
	onClose: () => void;
}) {
	const [open, setOpen] = useState(true);
	const [draftLocale, setDraftLocale] = useState(locale);
	const titleId = useId();
	const copy = localizationCopy[draftLocale];
	const requestClose = () => setOpen(false);
	const dialogRef = useModalAccessibility(requestClose);

	return (
		<div className="loc-language-layer" data-state={open ? "open" : "closed"}>
			<button
				type="button"
				className="prototype-detail-backdrop"
				aria-label={copy.close}
				onClick={requestClose}
				tabIndex={-1}
			/>
			<section
				className="loc-language-sheet"
				data-state={open ? "open" : "closed"}
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				onTransitionEnd={(event) => {
					if (event.target === event.currentTarget && !open) onClose();
				}}
			>
				<header>
					<div>
						<p>{copy.remembered}</p>
						<h2 id={titleId}>{copy.language}</h2>
					</div>
					<button
						type="button"
						onClick={requestClose}
						aria-label={copy.close}
						data-autofocus
					>
						<X />
					</button>
				</header>
				<p>{copy.languageDescription}</p>
				<div className="loc-language-options">
					{localeOptions.map((candidate) => (
						<button
							key={candidate}
							type="button"
							data-active={candidate === draftLocale || undefined}
							onClick={() => setDraftLocale(candidate)}
						>
							<span>
								{candidate === "en" ? "EN" : candidate === "ja" ? "あ" : "中"}
							</span>
							<strong>{localeNames[candidate]}</strong>
							{candidate === draftLocale ? <Check /> : null}
						</button>
					))}
				</div>
				<button
					className="loc-language-apply"
					type="button"
					onClick={() => {
						onApply(draftLocale);
						requestClose();
					}}
				>
					{copy.applyLanguage}
				</button>
			</section>
		</div>
	);
}

export default function LocalizationPrototype({
	mode,
	initialLocale,
	mastheadCopy,
	prototypePath = "/prototypes/catalog-localization",
	prototypeVariant,
}: {
	mode: LocalizationMode;
	initialLocale: PrototypeLocale;
	mastheadCopy?: PrototypeMastheadCopy;
	prototypePath?: string;
	prototypeVariant?: number;
}) {
	const [locale, setLocale] = useState<PrototypeLocale>(initialLocale);
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const [query, setQuery] = useState("");
	const [filters, setFilters] = useState(initialPrototypeFilters);
	const [draft, setDraft] = useState(initialPrototypeFilters);
	const [filterOpen, setFilterOpen] = useState(false);
	const [languageOpen, setLanguageOpen] = useState(false);
	const [selected, setSelected] = useState<PublicProduct | null>(null);
	const originalDocumentLanguage = useRef<string | null>(null);
	const copy = localizationCopy[locale];
	const masthead = mastheadCopy?.[locale] ?? copy;
	const products = useMemo(
		() => filterLocalizationProducts(productsWithFallback, query, filters),
		[query, filters],
	);

	useEffect(() => {
		originalDocumentLanguage.current = document.documentElement.lang;
		const urlLocale = new URL(window.location.href).searchParams.get("lang");
		if (urlLocale !== "en" && urlLocale !== "ja" && urlLocale !== "zh") {
			setLocale(resolveInitialLocale());
		}
		return () => {
			if (originalDocumentLanguage.current)
				document.documentElement.lang = originalDocumentLanguage.current;
		};
	}, []);

	useEffect(() => {
		document.documentElement.lang = locale;
	}, [locale]);

	useEffect(() => {
		const stored = localStorage.getItem("takonbini-catalog-theme");
		const preference = window.matchMedia("(prefers-color-scheme: dark)");
		if (stored === "light" || stored === "dark") {
			setTheme(stored);
			return;
		}
		const sync = () => setTheme(preference.matches ? "dark" : "light");
		sync();
		preference.addEventListener("change", sync);
		return () => preference.removeEventListener("change", sync);
	}, []);

	const changeLocale = (nextLocale: PrototypeLocale) => {
		setLocale(nextLocale);
		localStorage.setItem("takonbini-prototype-locale", nextLocale);
		const url = new URL(window.location.href);
		url.searchParams.set("lang", nextLocale);
		window.history.replaceState(null, "", url);
		window.dispatchEvent(
			new CustomEvent<PrototypeLocale>("takonbini:prototype-locale", {
				detail: nextLocale,
			}),
		);
		if (mode === "editions") {
			setSelected(null);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};
	const variantNumber =
		prototypeVariant ?? (mode === "direct" ? 1 : mode === "editions" ? 2 : 3);

	return (
		<div
			className={`catalog-prototype shiori-index loc-prototype loc-${mode}`}
			data-theme={theme}
			lang={locale}
		>
			<header className="shiori-header loc-header">
				<a href={`${prototypePath}?v=${variantNumber}&lang=${locale}`}>
					<b aria-hidden="true">栞</b>
					<span>{copy.brand}</span>
				</a>
				<p>{copy.strapline}</p>
				<div className="shiori-actions">
					{mode === "direct" ? (
						<LocaleSelect locale={locale} onChange={changeLocale} />
					) : null}
					{mode === "sheet" ? (
						<button
							className="loc-language-trigger"
							type="button"
							onClick={() => setLanguageOpen(true)}
							aria-label={copy.currentLanguage}
						>
							<Globe2 />
							<span>
								{locale === "en" ? "EN" : locale === "ja" ? "日本語" : "中文"}
							</span>
						</button>
					) : null}
					<button
						className="loc-theme-trigger"
						type="button"
						onClick={() => {
							const next = theme === "light" ? "dark" : "light";
							setTheme(next);
							localStorage.setItem("takonbini-catalog-theme", next);
						}}
						aria-label={theme === "light" ? copy.useDark : copy.useLight}
					>
						{theme === "light" ? <Moon /> : <Sun />}
					</button>
				</div>
			</header>
			<main className="shiori-main">
				{mode === "editions" ? (
					<nav className="loc-edition-switch" aria-label={copy.language}>
						{localeOptions.map((candidate, index) => (
							<button
								key={candidate}
								type="button"
								data-active={candidate === locale || undefined}
								aria-current={candidate === locale ? "page" : undefined}
								onClick={() => changeLocale(candidate)}
							>
								<span>{String(index + 1).padStart(2, "0")}</span>
								<strong>{localizationCopy[candidate].edition}</strong>
								<small>
									{candidate === "en"
										? "ENGLISH"
										: candidate === "ja"
											? "日本語"
											: "繁體中文"}
								</small>
							</button>
						))}
					</nav>
				) : null}
				<section className="shiori-intro loc-intro">
					<div>
						<h1 aria-label={masthead.headline.replace("\n", " ")}>
							{masthead.headline.split("\n").map((line) => (
								<span key={line}>{line}</span>
							))}
						</h1>
					</div>
					<p>{masthead.intro}</p>
				</section>
				<section className="shiori-toolbar">
					<label>
						<Search size={16} />
						<span className="sr-only">{copy.searchLabel}</span>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder={copy.searchPlaceholder}
						/>
					</label>
					<button
						className="proto-filter-trigger"
						type="button"
						onClick={() => {
							setDraft(filters);
							setFilterOpen(true);
						}}
					>
						<SlidersHorizontal size={15} /> {copy.filters}
						<b>{filterCount(filters)}</b>
					</button>
				</section>
				<div className="shiori-heading">
					<span>
						{copy.index} / {String(products.length).padStart(2, "0")}
					</span>
					<span>{copy.selectItem}</span>
				</div>
				{products.length ? (
					<section className="shiori-grid">
						{products.map((product, index) => {
							const title = resolvePrototypeText(product.title, locale);
							return (
								<button
									key={product.id}
									className="shiori-card"
									type="button"
									aria-label={title.text}
									onClick={() => setSelected(product)}
								>
									<figure className="shiori-card-image">
										{product.images[0] ? (
											<img src={product.images[0]} alt={title.text} />
										) : (
											<span>{copy.noImage}</span>
										)}
										<b>{String(index + 1).padStart(2, "0")}</b>
									</figure>
									<div className="shiori-card-meta">
										<p className={`store-ink store-${product.store}`}>
											{localizedStores[locale][product.store]} ·{` `}
											{product.category
												? (localizedCategories[locale][product.category] ??
													product.category)
												: ""}
										</p>
										{title.fallback ? (
											<span className="loc-fallback-note">{copy.fallback}</span>
										) : null}
										<h2 lang={title.language}>{title.text}</h2>
										<strong>
											{formatPrototypePrice(product.price, locale)}
										</strong>
									</div>
								</button>
							);
						})}
					</section>
				) : (
					<div className="shiori-empty">
						<span aria-hidden="true">零</span>
						<h2>{copy.noEntries}</h2>
						<button
							type="button"
							onClick={() => {
								setQuery("");
								setFilters(initialPrototypeFilters);
							}}
						>
							{copy.reset}
						</button>
					</div>
				)}
			</main>
			{filterOpen ? (
				<LocalizedFilterSheet
					locale={locale}
					draft={draft}
					setDraft={setDraft}
					onClose={() => setFilterOpen(false)}
					onApply={() => setFilters(draft)}
				/>
			) : null}
			{selected ? (
				<ProductDialog
					product={selected}
					locale={locale}
					onClosed={() => setSelected(null)}
				/>
			) : null}
			{languageOpen ? (
				<LanguageChooser
					locale={locale}
					onApply={changeLocale}
					onClose={() => setLanguageOpen(false)}
				/>
			) : null}
		</div>
	);
}
