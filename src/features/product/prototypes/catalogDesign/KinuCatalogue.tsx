import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PublicProduct } from "@/@types/product";
import {
	filterProducts,
	type PrototypeStore,
	productPrice,
	productTitle,
	prototypeProducts,
	storeNames,
} from "./prototypeData";

const stores: PrototypeStore[] = ["All", "SevenEleven", "Lawson", "FamilyMart"];

export default function KinuCatalogue() {
	const [query, setQuery] = useState("");
	const [store, setStore] = useState<PrototypeStore>("All");
	const [menuOpen, setMenuOpen] = useState(false);
	const [selected, setSelected] = useState<PublicProduct | null>(null);
	const products = useMemo(
		() => filterProducts(prototypeProducts, query, store),
		[query, store],
	);

	return (
		<div className="catalog-prototype kinu-catalogue">
			<header className="kinu-header">
				<a href="/prototypes/catalog-design?v=1" className="kinu-mark">
					<span>蛸</span>
					<b>TAKONBINI</b>
				</a>
				<p>今週の棚から · WEEKLY OBSERVATIONS</p>
				<button
					type="button"
					onClick={() => setMenuOpen((value) => !value)}
					aria-label="Browse stores"
				>
					<span />
					<span />
					<span />
				</button>
			</header>
			<section className="kinu-hero">
				<div className="kinu-vertical-index">
					<span>新しいもの</span>
					<i />
					<span>日々の発見</span>
					<i />
					<span>三つの店</span>
				</div>
				<div className="kinu-hero-title">
					<p>CATALOGUE OF SMALL DISCOVERIES</p>
					<h1>
						今週
						<br />
						の棚
					</h1>
					<span>vol. 32</span>
				</div>
				<p className="kinu-scroll">
					SCROLL <i />
				</p>
			</section>
			<main className="kinu-main">
				<section className="kinu-prologue">
					<p className="kinu-vertical-heading">
						いつまでも、
						<br />
						新しい。
					</p>
					<div>
						<p>Everyday shelves are always changing.</p>
						<p>
							We keep a quiet record of the small things worth noticing—observed
							weekly across Japan’s familiar convenience stores.
						</p>
					</div>
				</section>
				<section className="kinu-controls">
					<label>
						<Search size={17} />
						<span className="sr-only">Search the catalogue</span>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search rice balls, sweets, tea…"
						/>
					</label>
					<button type="button" onClick={() => setMenuOpen((value) => !value)}>
						<SlidersHorizontal size={16} />{" "}
						{store === "All" ? "All stores" : storeNames[store]}
					</button>
				</section>
				{menuOpen ? (
					<nav className="kinu-store-menu" aria-label="Store filters">
						{stores.map((option) => (
							<button
								type="button"
								key={option}
								data-active={store === option || undefined}
								onClick={() => {
									setStore(option);
									setMenuOpen(false);
								}}
							>
								{storeNames[option]}
							</button>
						))}
					</nav>
				) : null}
				<div className="kinu-result-rule">
					<span>{String(products.length).padStart(2, "0")} observations</span>
					<span>within the last 28 days</span>
				</div>
				{products.length ? (
					<section className="kinu-products">
						{products.map((product, index) => (
							<article className="kinu-product" key={product.id}>
								<div className="kinu-product-title">
									<span>{String(index + 1).padStart(2, "0")}</span>
									<div>
										<p>{product.title.ja}</p>
										<h2>{productTitle(product)}</h2>
									</div>
								</div>
								<button
									className="kinu-product-visual"
									type="button"
									onClick={() => setSelected(product)}
								>
									{product.images[0] ? (
										<img src={product.images[0]} alt="" />
									) : (
										<span>
											写真は準備中です
											<br />
											Image forthcoming
										</span>
									)}
									<i>{product.category}</i>
								</button>
								<div className="kinu-product-note">
									<p className={`store-ink store-${product.store}`}>
										{storeNames[product.store]}
									</p>
									<p>A weekly observation from Japan’s everyday shelves.</p>
									<strong>{productPrice(product)}</strong>
									<button type="button" onClick={() => setSelected(product)}>
										View details →
									</button>
								</div>
							</article>
						))}
					</section>
				) : (
					<div className="kinu-empty">
						<p>該当する商品はありません</p>
						<h2>Nothing matched this quiet search.</h2>
						<button
							type="button"
							onClick={() => {
								setQuery("");
								setStore("All");
							}}
						>
							Return to all observations
						</button>
					</div>
				)}
			</main>
			{selected ? (
				<div
					className="prototype-detail"
					role="dialog"
					aria-modal="true"
					aria-label={productTitle(selected)}
				>
					<button
						className="prototype-detail-backdrop"
						type="button"
						onClick={() => setSelected(null)}
						aria-label="Close details"
					/>
					<article className="kinu-detail">
						<button
							className="detail-close"
							type="button"
							onClick={() => setSelected(null)}
							aria-label="Close"
						>
							<X />
						</button>
						<div className="kinu-detail-image">
							{selected.images[0] ? (
								<img src={selected.images[0]} alt="" />
							) : null}
						</div>
						<div>
							<p className="kinu-vertical-heading">小さな発見</p>
							<span className={`store-ink store-${selected.store}`}>
								{storeNames[selected.store]} · {selected.category}
							</span>
							<h2>{productTitle(selected)}</h2>
							<p>{selected.title.ja}</p>
							<p>{selected.description.en}</p>
							<strong>{productPrice(selected)}</strong>
						</div>
					</article>
				</div>
			) : null}
		</div>
	);
}
