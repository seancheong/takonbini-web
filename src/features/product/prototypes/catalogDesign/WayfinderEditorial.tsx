import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PublicProduct } from "@/@types/product";
import {
	type PrototypeStore,
	productPrice,
	productTitle,
	prototypeProducts,
	storeNames,
} from "./prototypeData";

type Filters = {
	stores: Exclude<PrototypeStore, "All">[];
	categories: string[];
	maxPrice: number;
};

const initialFilters: Filters = { stores: [], categories: [], maxPrice: 1000 };
const storeOptions: Exclude<PrototypeStore, "All">[] = [
	"SevenEleven",
	"Lawson",
	"FamilyMart",
];
const categoryOptions = ["Onigiri", "Sweets", "Sandwich", "Drink"];

function toggle<T>(values: T[], value: T) {
	return values.includes(value)
		? values.filter((item) => item !== value)
		: [...values, value];
}

export default function WayfinderEditorial() {
	const [query, setQuery] = useState("");
	const [filters, setFilters] = useState<Filters>(initialFilters);
	const [draft, setDraft] = useState<Filters>(initialFilters);
	const [filterOpen, setFilterOpen] = useState(false);
	const [visibleCount, setVisibleCount] = useState(3);
	const [selected, setSelected] = useState<PublicProduct | null>(null);

	const products = useMemo(() => {
		const needle = query.trim().toLocaleLowerCase();
		return prototypeProducts.filter((product) => {
			const matchesSearch =
				!needle ||
				[
					product.title.en,
					product.title.ja,
					product.category,
					storeNames[product.store],
				]
					.filter(Boolean)
					.join(" ")
					.toLocaleLowerCase()
					.includes(needle);
			const matchesStore =
				filters.stores.length === 0 || filters.stores.includes(product.store);
			const matchesCategory =
				filters.categories.length === 0 ||
				(product.category !== undefined &&
					filters.categories.includes(product.category));
			const matchesPrice =
				product.price === 0 || product.price <= filters.maxPrice;
			return matchesSearch && matchesStore && matchesCategory && matchesPrice;
		});
	}, [filters, query]);

	const applied = [
		...filters.stores.map((store) => ({
			key: `store:${store}`,
			label: storeNames[store],
		})),
		...filters.categories.map((category) => ({
			key: `category:${category}`,
			label: category,
		})),
		...(filters.maxPrice < 1000
			? [{ key: "price", label: `Under ¥${filters.maxPrice}` }]
			: []),
	];

	const removeFilter = (key: string) => {
		setFilters((current) => {
			if (key.startsWith("store:")) {
				return {
					...current,
					stores: current.stores.filter((store) => store !== key.slice(6)),
				};
			}
			if (key.startsWith("category:")) {
				return {
					...current,
					categories: current.categories.filter(
						(category) => category !== key.slice(9),
					),
				};
			}
			return { ...current, maxPrice: 1000 };
		});
		setVisibleCount(3);
	};

	return (
		<div className="catalog-prototype wayfinder-editorial min-h-screen bg-[#f7f6f2] text-zinc-900">
			<header className="sticky top-0 z-50 border-b border-zinc-300 bg-[#f7f6f2]/95 px-5 backdrop-blur-md sm:px-8">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between">
					<a
						href="/prototypes/catalog-design?v=4"
						className="text-sm font-semibold tracking-tight"
					>
						Takonbini
					</a>
					<div className="flex items-center gap-5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
						<span>Observed weekly</span>
						<button type="button">EN / 日本語</button>
					</div>
				</div>
			</header>

			<main className="pb-32">
				<section className="mx-auto max-w-6xl px-5 pb-0 pt-20 sm:px-8 sm:pt-24">
					<p className="text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-500">
						Observed this week · Japan
					</p>
					<div className="mt-6 grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-end">
						<h1 className="max-w-xl text-5xl font-normal leading-[0.96] tracking-[-0.04em] sm:text-7xl">
							Find something
							<br />
							worth trying.
						</h1>
						<p className="max-w-md text-sm leading-6 text-zinc-600 md:justify-self-end">
							A calm weekly edit from Japan’s convenience-store shelves.
							Observed listings, never a promise of local stock.
						</p>
					</div>
				</section>

				<div className="sticky top-14 z-40 mt-12 border-y border-zinc-300 bg-[#f7f6f2]/95 backdrop-blur-md">
					<div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:px-8">
						<label className="flex flex-1 items-center gap-3">
							<Search aria-hidden="true" className="size-4 text-zinc-500" />
							<span className="sr-only">Search products</span>
							<input
								value={query}
								onChange={(event) => {
									setQuery(event.target.value);
									setVisibleCount(3);
								}}
								placeholder="Search rice balls, sweets, tea…"
								className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
							/>
						</label>
						<button
							type="button"
							onClick={() => {
								setDraft(filters);
								setFilterOpen(true);
							}}
							className="flex items-center justify-between gap-4 rounded-full border border-zinc-900 px-4 py-2 text-sm"
						>
							<span className="flex items-center gap-2">
								<SlidersHorizontal className="size-4" /> Filters
							</span>
							<span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">
								{applied.length}
							</span>
						</button>
					</div>
				</div>

				{applied.length ? (
					<div className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center gap-2 px-5 text-xs sm:px-8">
						<span className="text-zinc-500">Applied</span>
						{applied.map((filter) => (
							<button
								key={filter.key}
								type="button"
								onClick={() => removeFilter(filter.key)}
								className="rounded-full bg-white px-3 py-1.5 shadow-sm"
							>
								{filter.label} ×
							</button>
						))}
					</div>
				) : null}

				<section className="mx-auto mt-12 max-w-6xl px-5 sm:px-8">
					<div className="mb-6 flex items-end justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
								Weekly new
							</p>
							<h2 className="mt-2 text-2xl font-medium">Fresh observations</h2>
						</div>
						<output aria-live="polite" className="text-xs text-zinc-500">
							{Math.min(visibleCount, products.length)} of {products.length}
						</output>
					</div>

					{products.length ? (
						<>
							<div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
								{products.slice(0, visibleCount).map((product, index) => (
									<button
										key={product.id}
										type="button"
										onClick={() => setSelected(product)}
										className={`group text-left ${index === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}
									>
										<div
											className={`overflow-hidden bg-[#e8e5dd] ${index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
										>
											{product.images[0] ? (
												<img
													src={product.images[0]}
													alt=""
													className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-xs text-zinc-500">
													Image intentionally unavailable
												</div>
											)}
										</div>
										<div className="mt-4 flex items-start justify-between gap-4 border-t border-zinc-300 pt-3">
											<div>
												<p
													className={`text-[10px] font-semibold uppercase tracking-[0.16em] store-ink store-${product.store}`}
												>
													{storeNames[product.store]}{" "}
													<span className="font-normal text-zinc-500">
														· {product.category}
													</span>
												</p>
												<h3 className="mt-1 text-lg leading-tight">
													{productTitle(product)}
												</h3>
											</div>
											<p className="shrink-0 text-sm">
												{productPrice(product)}
											</p>
										</div>
									</button>
								))}
							</div>
							<div className="mt-12 border-t border-zinc-300 py-8 text-center text-sm text-zinc-500">
								{visibleCount < products.length ? (
									<button
										type="button"
										onClick={() =>
											setVisibleCount((count) =>
												Math.min(count + 2, products.length),
											)
										}
									>
										{visibleCount} of {products.length} shown · Load more
										observations
									</button>
								) : (
									`All ${products.length} observations shown · You’re all caught up`
								)}
							</div>
						</>
					) : (
						<div className="my-16 border-y border-zinc-200 p-8 text-center">
							<p className="text-2xl font-medium">Nothing matched</p>
							<p className="mt-3 text-sm text-zinc-600">
								Your search and filters are still applied.
							</p>
							<button
								type="button"
								className="mt-6 rounded-full border border-zinc-950 px-5 py-2 text-sm font-semibold"
								onClick={() => {
									setQuery("");
									setFilters(initialFilters);
								}}
							>
								Clear filters
							</button>
						</div>
					)}
				</section>
			</main>

			{filterOpen ? (
				<div className="fixed inset-0 z-90 flex items-end bg-black/45 sm:items-center sm:justify-center">
					<button
						type="button"
						className="absolute inset-0"
						aria-label="Close filters"
						onClick={() => setFilterOpen(false)}
					/>
					<section
						role="dialog"
						aria-modal="true"
						aria-label="Catalog filters"
						className="relative z-10 max-h-[88vh] w-full overflow-auto rounded-t-3xl bg-white p-6 text-zinc-900 sm:max-w-md sm:rounded-3xl"
					>
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-medium">Refine the shelf</h2>
							<button
								type="button"
								className="rounded-full p-2"
								onClick={() => setFilterOpen(false)}
								aria-label="Close"
							>
								<X className="size-5" />
							</button>
						</div>
						<fieldset className="mt-7">
							<legend className="text-sm font-semibold">Store</legend>
							<div className="mt-3 flex flex-wrap gap-2">
								{storeOptions.map((store) => (
									<label
										key={store}
										className="cursor-pointer rounded-full border border-zinc-300 px-3 py-2 text-sm"
									>
										<input
											type="checkbox"
											checked={draft.stores.includes(store)}
											onChange={() =>
												setDraft((current) => ({
													...current,
													stores: toggle(current.stores, store),
												}))
											}
											className="mr-2 accent-zinc-950"
										/>
										{storeNames[store]}
									</label>
								))}
							</div>
						</fieldset>
						<fieldset className="mt-7">
							<legend className="text-sm font-semibold">
								What are you craving?
							</legend>
							<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
								{categoryOptions.map((category) => (
									<label
										key={category}
										className="flex items-center gap-2 py-1.5"
									>
										<input
											type="checkbox"
											checked={draft.categories.includes(category)}
											onChange={() =>
												setDraft((current) => ({
													...current,
													categories: toggle(current.categories, category),
												}))
											}
											className="size-4 accent-zinc-950"
										/>
										{category}
									</label>
								))}
							</div>
						</fieldset>
						<label className="mt-7 block text-sm font-semibold">
							Maximum price · ¥{draft.maxPrice}
							<input
								type="range"
								min="100"
								max="1000"
								value={draft.maxPrice}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										maxPrice: Number(event.target.value),
									}))
								}
								className="mt-3 w-full accent-zinc-950"
							/>
						</label>
						<button
							type="button"
							onClick={() => {
								setFilters(draft);
								setVisibleCount(3);
								setFilterOpen(false);
							}}
							className="mt-8 w-full rounded-full bg-zinc-950 px-5 py-3 font-semibold text-white"
						>
							Show matching products
						</button>
					</section>
				</div>
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
					<article className="relative z-10 grid w-full max-w-4xl overflow-hidden bg-[#f7f6f2] shadow-2xl md:grid-cols-2">
						<div className="aspect-square bg-[#e8e5dd]">
							{selected.images[0] ? (
								<img src={selected.images[0]} alt="" />
							) : null}
						</div>
						<div className="relative p-8">
							<button
								type="button"
								onClick={() => setSelected(null)}
								className="mb-8 flex items-center gap-2 border-b border-zinc-400 pb-1 text-sm font-semibold"
							>
								<ArrowLeft className="size-4" /> Back to results
							</button>
							<p
								className={`text-xs font-bold uppercase tracking-wider store-ink store-${selected.store}`}
							>
								{storeNames[selected.store]}{" "}
								<span className="text-zinc-500">· {selected.category}</span>
							</p>
							<h2 className="mt-5 text-4xl font-normal leading-[1.05] tracking-tight">
								{productTitle(selected)}
							</h2>
							<p className="mt-3 text-lg text-zinc-500">{selected.title.ja}</p>
							<p className="mt-8 text-2xl">{productPrice(selected)}</p>
							<p className="mt-6 text-sm leading-6 text-zinc-600">
								{selected.description.en}
							</p>
						</div>
					</article>
				</div>
			) : null}
		</div>
	);
}
