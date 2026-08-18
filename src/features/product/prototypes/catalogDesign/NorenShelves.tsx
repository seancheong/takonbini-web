import { Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
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

export default function NorenShelves() {
	const [query, setQuery] = useState("");
	const [filters, setFilters] = useState(initialPrototypeFilters);
	const [draft, setDraft] = useState(initialPrototypeFilters);
	const [filterOpen, setFilterOpen] = useState(false);
	const [selected, setSelected] = useState<PublicProduct | null>(null);
	const products = useMemo(
		() => filterPrototypeProducts(prototypeProducts, query, filters),
		[query, filters],
	);

	return (
		<div className="catalog-prototype noren-shelves">
			<header className="noren-header">
				<a href="/prototypes/catalog-design?v=3">
					<span>蛸</span>
					<b>たこンビニ</b>
				</a>
				<p>THE WEEKLY KONBINI CURTAIN</p>
				<button type="button">日本語 / EN</button>
			</header>
			<section className="noren-hero">
				<div className="noren-panels">
					<i />
					<i />
					<i />
				</div>
				<div>
					<p>今週の新商品</p>
					<h1>
						Three stores.
						<br />
						One weekly shelf.
					</h1>
					<span>Fresh observations from Japan’s everyday corners.</span>
				</div>
				<b>第三十二号</b>
			</section>
			<main className="noren-main">
				<section className="noren-controls">
					<label>
						<Search size={17} />
						<span className="sr-only">Search products</span>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="What are you craving?"
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
				<div className="noren-meta">
					<span>
						{String(products.length).padStart(2, "0")} ITEMS ON THE SHELF
					</span>
					<span>UPDATED WEEKLY · NOT LIVE STOCK</span>
				</div>
				{products.length ? (
					<section className="noren-grid">
						{products.map((product, index) => (
							<button
								key={product.id}
								type="button"
								className={`noren-card noren-${product.store}`}
								onClick={() => setSelected(product)}
							>
								<div className="noren-card-curtain">
									<span>{index % 2 ? "旬" : "新"}</span>
									<i />
									<i />
									<i />
								</div>
								<div className="noren-card-image">
									{product.images[0] ? (
										<img src={product.images[0]} alt="" />
									) : (
										<span>
											写真
											<br />
											準備中
										</span>
									)}
								</div>
								<div className="noren-card-copy">
									<p>
										{storeNames[product.store]} · {product.category}
									</p>
									<h2>{product.title.ja}</h2>
									<span>{productTitle(product)}</span>
									<strong>{productPrice(product)}</strong>
								</div>
							</button>
						))}
					</section>
				) : (
					<div className="noren-empty">
						<ShoppingBag />
						<h2>The shelf is quiet.</h2>
						<p>Try a different craving or open every curtain.</p>
						<button
							type="button"
							onClick={() => {
								setQuery("");
								setFilters(initialPrototypeFilters);
							}}
						>
							Show everything
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
					<article className={`noren-detail noren-${selected.store}`}>
						<div className="noren-detail-curtain">
							<span>新</span>
							<button
								className="detail-close"
								type="button"
								onClick={() => setSelected(null)}
								aria-label="Close"
							>
								<X />
							</button>
						</div>
						<div className="noren-detail-image">
							{selected.images[0] ? (
								<img src={selected.images[0]} alt="" />
							) : null}
						</div>
						<div className="noren-detail-copy">
							<p>
								{storeNames[selected.store]} · {selected.category}
							</p>
							<h2>{selected.title.ja}</h2>
							<h3>{productTitle(selected)}</h3>
							<p>{selected.description.en}</p>
							<strong>{productPrice(selected)}</strong>
						</div>
					</article>
				</div>
			) : null}
		</div>
	);
}
