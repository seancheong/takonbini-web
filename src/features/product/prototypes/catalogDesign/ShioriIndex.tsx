import { Moon, Search, SlidersHorizontal, Sun, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "@/@types/product";
import {
	filterCount,
	filterPrototypeProducts,
	initialPrototypeFilters,
	PrototypeFilterSheet,
} from "./PrototypeFilterSheet";
import {
	productPrice,
	productTitle,
	prototypeProducts,
	storeNames,
} from "./prototypeData";
import { useModalAccessibility } from "./useModalAccessibility";

type ProductDialogProps = {
	product: PublicProduct;
	onClosed: () => void;
};

function ShioriProductDialog({ product, onClosed }: ProductDialogProps) {
	const [open, setOpen] = useState(true);
	const requestClose = () => setOpen(false);
	const dialogRef = useModalAccessibility(requestClose);

	return (
		<div
			className="prototype-detail"
			data-state={open ? "open" : "closed"}
			role="dialog"
			aria-modal="true"
			aria-label={productTitle(product)}
			ref={dialogRef}
		>
			<button
				className="prototype-detail-backdrop"
				type="button"
				onClick={requestClose}
				aria-label="Close details"
				tabIndex={-1}
			/>
			<article
				className="shiori-detail"
				data-state={open ? "open" : "closed"}
				onTransitionEnd={(event) => {
					if (event.target === event.currentTarget && !open) onClosed();
				}}
			>
				<button
					className="detail-close"
					type="button"
					onClick={requestClose}
					aria-label="Close"
					data-autofocus
				>
					<X />
				</button>
				<div className="shiori-detail-image">
					{product.images[0] ? (
						<img src={product.images[0]} alt="" />
					) : (
						<span lang="ja">写真準備中</span>
					)}
				</div>
				<section>
					<p className={`store-ink store-${product.store}`}>
						{storeNames[product.store]} · {product.category}
					</p>
					<span lang="ja">{product.title.ja}</span>
					<h2 lang={product.title.en ? "en" : "ja"}>{productTitle(product)}</h2>
					<p>{product.description.en}</p>
					<strong>{productPrice(product)}</strong>
				</section>
			</article>
		</div>
	);
}

export default function ShioriIndex() {
	const [query, setQuery] = useState("");
	const [theme, setTheme] = useState<"light" | "dark">("light");
	const [filters, setFilters] = useState(initialPrototypeFilters);
	const [draft, setDraft] = useState(initialPrototypeFilters);
	const [filterOpen, setFilterOpen] = useState(false);
	const [selected, setSelected] = useState<PublicProduct | null>(null);
	const products = useMemo(
		() => filterPrototypeProducts(prototypeProducts, query, filters),
		[query, filters],
	);

	useEffect(() => {
		const stored = localStorage.getItem("takonbini-catalog-theme");
		const preference = window.matchMedia("(prefers-color-scheme: dark)");
		if (stored === "light" || stored === "dark") {
			setTheme(stored);
			return;
		}
		const syncSystemTheme = () =>
			setTheme(preference.matches ? "dark" : "light");
		syncSystemTheme();
		preference.addEventListener("change", syncSystemTheme);
		return () => preference.removeEventListener("change", syncSystemTheme);
	}, []);

	return (
		<div className="catalog-prototype shiori-index" data-theme={theme}>
			<header className="shiori-header">
				<a href="/prototypes/catalog-design?v=2">
					<b lang="ja">たこ</b>
					<span>TAKONBINI</span>
				</a>
				<p>
					<span lang="ja">栞</span> — A WEEKLY SHELF INDEX
				</p>
				<div className="shiori-actions">
					<button
						type="button"
						onClick={() => {
							const nextTheme = theme === "light" ? "dark" : "light";
							setTheme(nextTheme);
							localStorage.setItem("takonbini-catalog-theme", nextTheme);
						}}
						aria-label={`Use ${theme === "light" ? "dark" : "light"} mode`}
					>
						{theme === "light" ? <Moon /> : <Sun />}
					</button>
				</div>
			</header>
			<main className="shiori-main">
				<section className="shiori-intro">
					<div>
						<span lang="ja">第三十二号</span>
						<h1>
							Small things,
							<br />
							carefully indexed.
						</h1>
					</div>
					<p lang="ja">
						コンビニの新しいものを、
						<br />
						毎週静かに記録しています。
						<small lang="en">
							New convenience-store products, observed and arranged with care.
						</small>
					</p>
				</section>
				<section className="shiori-toolbar">
					<label>
						<Search size={16} />
						<span className="sr-only">Search the index</span>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search the weekly index"
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
						<SlidersHorizontal size={15} /> Filters
						<b>{filterCount(filters)}</b>
					</button>
				</section>
				<div className="shiori-heading">
					<span>INDEX / {String(products.length).padStart(2, "0")}</span>
					<span>SELECT AN ITEM TO READ</span>
				</div>
				{products.length ? (
					<section className="shiori-grid">
						{products.map((product, index) => (
							<button
								key={product.id}
								className="shiori-card"
								type="button"
								onClick={() => setSelected(product)}
							>
								<figure className="shiori-card-image">
									{product.images[0] ? (
										<img src={product.images[0]} alt="" />
									) : (
										<span lang="ja">写真準備中</span>
									)}
									<b>{String(index + 1).padStart(2, "0")}</b>
								</figure>
								<div className="shiori-card-meta">
									<p className={`store-ink store-${product.store}`}>
										{storeNames[product.store]} · {product.category}
									</p>
									<span lang="ja">{product.title.ja}</span>
									<h2 lang={product.title.en ? "en" : "ja"}>
										{productTitle(product)}
									</h2>
									<strong>{productPrice(product)}</strong>
								</div>
							</button>
						))}
					</section>
				) : (
					<div className="shiori-empty">
						<span lang="ja">零</span>
						<h2>No entries found.</h2>
						<button
							type="button"
							onClick={() => {
								setQuery("");
								setFilters(initialPrototypeFilters);
							}}
						>
							Reset the index
						</button>
					</div>
				)}
			</main>
			{filterOpen ? (
				<PrototypeFilterSheet
					draft={draft}
					setDraft={setDraft}
					onClose={() => setFilterOpen(false)}
					onApply={() => {
						setFilters(draft);
					}}
				/>
			) : null}
			{selected ? (
				<ShioriProductDialog
					product={selected}
					onClosed={() => setSelected(null)}
				/>
			) : null}
		</div>
	);
}
