import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Search,
	SlidersHorizontal,
	Sparkles,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicProduct } from "@/@types/product";
import { makeCatalogPrototypeFixtures } from "../fixtures/catalogPrototypeFixtures";

export const catalogPrototypeVariants = ["editorial", "energy"] as const;
export type CatalogPrototypeVariant = (typeof catalogPrototypeVariants)[number];

type ListingState = "results" | "empty" | "no-match" | "error";

type CatalogDirectionsPrototypeProps = {
	variant: CatalogPrototypeVariant;
};

const variantNames: Record<CatalogPrototypeVariant, string> = {
	editorial: "Editorial restraint",
	energy: "Konbini energy",
};

const storeNames: Record<PublicProduct["store"], string> = {
	SevenEleven: "7-Eleven",
	Lawson: "Lawson",
	FamilyMart: "FamilyMart",
};

const storeStyles: Record<PublicProduct["store"], string> = {
	SevenEleven: "bg-orange-500 text-white",
	Lawson: "bg-blue-600 text-white",
	FamilyMart: "bg-emerald-600 text-white",
};

const restrainedStoreStyles: Record<PublicProduct["store"], string> = {
	SevenEleven: "text-orange-700",
	Lawson: "text-blue-700",
	FamilyMart: "text-emerald-700",
};

const fixtures = makeCatalogPrototypeFixtures(new Date("2026-08-01T00:00:00Z"));
const activeProducts = fixtures
	.filter(({ observation }) => observation.freshness === "active")
	.map(({ product }) => product);

const formatPrice = (price: number) =>
	price === 0 ? "Price unknown" : `¥${price.toLocaleString("en-US")}`;

function FilterDialog({
	open,
	onClose,
	energy = false,
}: {
	open: boolean;
	onClose: () => void;
	energy?: boolean;
}) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-70 flex items-end bg-black/45 sm:items-center sm:justify-center">
			<button
				type="button"
				aria-label="Close filters"
				className="absolute inset-0"
				onClick={onClose}
			/>
			<section
				role="dialog"
				aria-modal="true"
				aria-label="Catalog filters"
				className={`relative z-10 max-h-[88vh] w-full overflow-auto p-6 sm:max-w-md ${
					energy
						? "rounded-t-[2rem] border-4 border-zinc-950 bg-yellow-50 sm:rounded-[2rem]"
						: "rounded-t-3xl bg-white sm:rounded-3xl"
				}`}
			>
				<div className="flex items-center justify-between">
					<h2
						className={`text-xl ${energy ? "font-black uppercase" : "font-medium"}`}
					>
						Refine the shelf
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full p-2 hover:bg-black/5"
					>
						<X aria-hidden="true" className="size-5" />
						<span className="sr-only">Close</span>
					</button>
				</div>
				<div className="mt-7 space-y-7">
					<fieldset>
						<legend className="text-sm font-semibold">Store</legend>
						<div className="mt-3 flex flex-wrap gap-2">
							{["7-Eleven", "Lawson", "FamilyMart"].map((store, index) => (
								<label
									key={store}
									className={`cursor-pointer border px-3 py-2 text-sm ${
										energy
											? "rounded-lg border-zinc-950 font-bold"
											: "rounded-full border-zinc-300"
									}`}
								>
									<input
										type="checkbox"
										defaultChecked={index === 1}
										className="mr-2 accent-zinc-950"
									/>
									{store}
								</label>
							))}
						</div>
					</fieldset>
					<fieldset>
						<legend className="text-sm font-semibold">
							What are you craving?
						</legend>
						<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
							{["Rice balls", "Sweets", "Sandwiches", "Drinks"].map(
								(category) => (
									<label
										key={category}
										className="flex items-center gap-2 py-1.5"
									>
										<input type="checkbox" className="size-4 accent-zinc-950" />
										{category}
									</label>
								),
							)}
						</div>
					</fieldset>
					<label className="block text-sm font-semibold">
						Maximum price · ¥650
						<input
							type="range"
							min="100"
							max="1000"
							defaultValue="650"
							className="mt-3 w-full accent-zinc-950"
						/>
					</label>
				</div>
				<button
					type="button"
					onClick={onClose}
					className={`mt-8 w-full px-5 py-3 font-semibold ${
						energy
							? "rounded-xl bg-zinc-950 text-yellow-50 shadow-[4px_4px_0_#f97316]"
							: "rounded-full bg-zinc-950 text-white"
					}`}
				>
					Show 5 products
				</button>
			</section>
		</div>
	);
}

function StateMessage({
	state,
	energy = false,
}: {
	state: Exclude<ListingState, "results">;
	energy?: boolean;
}) {
	const copy = {
		empty: [
			"The shelf is quiet",
			"No current catalog observations are ready yet.",
		],
		"no-match": [
			"Nothing matched",
			"Try removing Lawson or widening the price range.",
		],
		error: [
			"We dropped the basket",
			"The catalog could not load. Your filters are still here.",
		],
	}[state];

	return (
		<div
			className={`mx-auto my-16 max-w-lg p-8 text-center ${energy ? "rotate-[-1deg] border-4 border-zinc-950 bg-yellow-200 shadow-[8px_8px_0_#18181b]" : "border-y border-zinc-200"}`}
		>
			<p
				className={`text-2xl ${energy ? "font-black uppercase" : "font-medium"}`}
			>
				{copy[0]}
			</p>
			<p className="mt-3 text-sm text-zinc-600">{copy[1]}</p>
			{state !== "empty" ? (
				<button
					type="button"
					className={`mt-6 px-5 py-2 text-sm font-semibold ${energy ? "rounded-lg bg-zinc-950 text-white" : "rounded-full border border-zinc-950"}`}
				>
					{state === "error" ? "Try again" : "Clear filters"}
				</button>
			) : null}
		</div>
	);
}

function EditorialDirection({
	products,
	state,
	onFilter,
	onSelect,
}: {
	products: PublicProduct[];
	state: ListingState;
	onFilter: () => void;
	onSelect: (product: PublicProduct) => void;
}) {
	return (
		<main className="min-h-screen bg-[#f7f6f2] pb-32 text-zinc-900">
			<section className="mx-auto max-w-6xl px-5 pb-10 pt-28 sm:px-8 sm:pt-32">
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
						A calm weekly edit from Japan’s convenience-store shelves. Observed
						listings, never a promise of local stock.
					</p>
				</div>
				<div className="mt-12 flex flex-col gap-3 border-y border-zinc-300 py-4 sm:flex-row sm:items-center">
					<label className="flex flex-1 items-center gap-3">
						<Search aria-hidden="true" className="size-4 text-zinc-500" />
						<span className="sr-only">Search products</span>
						<input
							placeholder="Search rice balls, sweets, tea…"
							className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
						/>
					</label>
					<button
						type="button"
						onClick={onFilter}
						className="flex items-center justify-between gap-4 rounded-full border border-zinc-900 px-4 py-2 text-sm"
					>
						<span>Filters</span>
						<span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">
							2
						</span>
					</button>
				</div>
				<div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
					<span className="text-zinc-500">Applied</span>
					{["Lawson", "Under ¥650"].map((filter) => (
						<button
							type="button"
							key={filter}
							className="rounded-full bg-white px-3 py-1.5 shadow-sm"
						>
							{filter} ×
						</button>
					))}
				</div>
			</section>
			{state === "results" ? (
				<section className="mx-auto max-w-6xl px-5 sm:px-8">
					<div className="mb-6 flex items-end justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
								Weekly new
							</p>
							<h2 className="mt-2 text-2xl font-medium">Fresh observations</h2>
						</div>
						<p className="text-xs text-zinc-500">5 products</p>
					</div>
					<div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
						{products.map((product, index) => (
							<button
								type="button"
								key={product.id}
								onClick={() => onSelect(product)}
								className={`group text-left ${index === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}
							>
								<div
									className={`overflow-hidden bg-[#e8e5dd] ${index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
								>
									{product.images[0] ? (
										<img
											src={product.images[0]}
											alt=""
											className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
										/>
									) : (
										<div className="flex h-full items-center justify-center text-xs text-zinc-500">
											Image intentionally unavailable
										</div>
									)}
								</div>
								<div className="mt-4 flex items-start justify-between gap-4 border-t border-zinc-300 pt-3">
									<div>
										<p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
											<span
												className={`font-semibold ${restrainedStoreStyles[product.store]}`}
											>
												{storeNames[product.store]}
											</span>{" "}
											· {product.category}
										</p>
										<h3 className="mt-1 text-lg leading-tight">
											{product.title.en}
										</h3>
									</div>
									<p className="shrink-0 text-sm">
										{formatPrice(product.price)}
									</p>
								</div>
							</button>
						))}
					</div>
				</section>
			) : (
				<StateMessage state={state} />
			)}
		</main>
	);
}

function EnergyDirection({
	products,
	state,
	onFilter,
	onSelect,
}: {
	products: PublicProduct[];
	state: ListingState;
	onFilter: () => void;
	onSelect: (product: PublicProduct) => void;
}) {
	return (
		<main className="min-h-screen bg-[#fff8dc] pb-32 text-zinc-950">
			<div className="h-3 bg-[linear-gradient(90deg,#f97316_0_33%,#2563eb_33%_66%,#059669_66%)]" />
			<section className="mx-auto max-w-6xl px-4 pb-8 pt-24 sm:px-8 sm:pt-28">
				<div className="relative overflow-hidden rounded-[2rem] border-4 border-zinc-950 bg-[#ffdf38] p-5 shadow-[7px_7px_0_#18181b] sm:p-8">
					<div className="absolute -right-8 -top-10 size-40 rounded-full bg-orange-500" />
					<div className="relative max-w-3xl">
						<p className="inline-block rotate-[-2deg] bg-zinc-950 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
							This week’s shelf report
						</p>
						<h1 className="mt-5 text-4xl font-black uppercase leading-[0.88] tracking-[-0.05em] sm:text-7xl">
							What’s good
							<br />
							at the konbini?
						</h1>
						<p className="mt-5 max-w-xl font-medium">
							Bright finds from three stores. Based on weekly observations—not
							real-time stock.
						</p>
					</div>
				</div>
				<div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
					<label className="flex items-center gap-3 rounded-xl border-3 border-zinc-950 bg-white px-4 shadow-[3px_3px_0_#18181b]">
						<Search aria-hidden="true" className="size-5" />
						<span className="sr-only">Search products</span>
						<input
							placeholder="Hunt the shelves…"
							className="w-full bg-transparent py-3 font-bold outline-none placeholder:text-zinc-500"
						/>
					</label>
					<button
						type="button"
						onClick={onFilter}
						aria-label="Filters, 2 applied"
						className="flex items-center gap-2 rounded-xl border-3 border-zinc-950 bg-orange-500 px-4 font-black text-white shadow-[3px_3px_0_#18181b]"
					>
						<SlidersHorizontal className="size-5" />
						<span className="hidden sm:inline">FILTERS</span>
						<span className="rounded-full bg-white px-2 text-xs text-zinc-950">
							2
						</span>
					</button>
				</div>
				<div className="mt-4 flex gap-2 overflow-x-auto pb-2 text-xs font-black uppercase">
					{["× Lawson", "× Under ¥650", "+ Category", "+ Region"].map(
						(filter, index) => (
							<button
								type="button"
								key={filter}
								className={`shrink-0 rounded-lg border-2 border-zinc-950 px-3 py-2 ${index < 2 ? "bg-blue-600 text-white" : "bg-white"}`}
							>
								{filter}
							</button>
						),
					)}
				</div>
			</section>
			{state === "results" ? (
				<section className="mx-auto max-w-6xl px-4 sm:px-8">
					<div className="mb-5 flex items-center justify-between border-b-4 border-zinc-950 pb-3">
						<h2 className="flex items-center gap-2 text-2xl font-black uppercase">
							<Sparkles className="size-6 fill-orange-500 text-orange-500" />
							New this week!
						</h2>
						<span className="font-mono text-sm font-bold">05 ITEMS</span>
					</div>
					<div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
						{products.map((product, index) => (
							<button
								type="button"
								key={product.id}
								onClick={() => onSelect(product)}
								className={`group overflow-hidden rounded-2xl border-3 border-zinc-950 bg-white text-left shadow-[4px_4px_0_#18181b] transition hover:-translate-y-1 ${index === 0 ? "col-span-2 sm:col-span-1" : ""}`}
							>
								<div className="relative aspect-[4/3] border-b-3 border-zinc-950 bg-orange-100">
									{product.images[0] ? (
										<img
											src={product.images[0]}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full items-center justify-center p-3 text-center text-xs font-bold">
											NO PHOTO
											<br />
											YET!
										</div>
									)}
									{index < 2 ? (
										<span className="absolute left-2 top-2 rotate-[-4deg] border-2 border-zinc-950 bg-[#ffdf38] px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#18181b]">
											New!
										</span>
									) : null}
									<span
										className={`absolute bottom-2 right-2 rounded-md px-2 py-1 text-[10px] font-black uppercase ${storeStyles[product.store]}`}
									>
										{storeNames[product.store]}
									</span>
								</div>
								<div className="p-3 sm:p-4">
									<p className="text-[10px] font-black uppercase text-zinc-500">
										{product.category}
									</p>
									<h3 className="mt-1 min-h-10 text-sm font-black leading-tight sm:text-lg">
										{product.title.en}
									</h3>
									<div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-zinc-300 pt-2">
										<span className="text-[10px] font-bold uppercase">
											Observed weekly
										</span>
										<span className="font-mono text-sm font-black">
											{formatPrice(product.price)}
										</span>
									</div>
								</div>
							</button>
						))}
					</div>
				</section>
			) : (
				<StateMessage state={state} energy />
			)}
		</main>
	);
}

function ProductDetail({
	product,
	variant,
	onBack,
}: {
	product: PublicProduct;
	variant: CatalogPrototypeVariant;
	onBack: () => void;
}) {
	const energy = variant === "energy";
	return (
		<main
			className={`min-h-screen px-5 pb-32 pt-24 text-zinc-950 sm:px-8 sm:pt-28 ${energy ? "bg-[#fff8dc]" : "bg-[#f7f6f2]"}`}
		>
			<section className="mx-auto max-w-5xl">
				<button
					type="button"
					onClick={onBack}
					className={`mb-6 flex items-center gap-2 text-sm font-semibold ${energy ? "rounded-lg border-2 border-zinc-950 bg-white px-3 py-2 shadow-[2px_2px_0_#18181b]" : "border-b border-zinc-400 pb-1"}`}
				>
					<ArrowLeft className="size-4" />
					Back to results
				</button>
				<div
					className={`grid overflow-hidden md:grid-cols-2 ${energy ? "rounded-[2rem] border-4 border-zinc-950 bg-white shadow-[8px_8px_0_#18181b]" : "gap-10"}`}
				>
					<div
						className={`aspect-square ${energy ? "border-b-4 border-zinc-950 bg-orange-100 md:border-b-0 md:border-r-4" : "bg-[#e8e5dd]"}`}
					>
						{product.images[0] ? (
							<img
								src={product.images[0]}
								alt=""
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full items-center justify-center text-sm text-zinc-500">
								Image intentionally unavailable
							</div>
						)}
					</div>
					<div className={energy ? "p-6 sm:p-9" : "py-4"}>
						<p
							className={`inline-block text-xs font-bold uppercase tracking-wider ${energy ? `${storeStyles[product.store]} rounded-md px-2 py-1` : restrainedStoreStyles[product.store]}`}
						>
							{storeNames[product.store]}
							<span className={energy ? "" : "text-zinc-500"}>
								{" "}
								· {product.category}
							</span>
						</p>
						<h1
							className={`mt-5 leading-[1.05] ${energy ? "text-4xl font-black uppercase" : "text-4xl font-normal tracking-tight sm:text-5xl"}`}
						>
							{product.title.en}
						</h1>
						<p className="mt-3 text-lg text-zinc-500">{product.title.ja}</p>
						<p
							className={`mt-8 ${energy ? "font-mono text-3xl font-black" : "text-2xl"}`}
						>
							{formatPrice(product.price)}
						</p>
						<p className="mt-6 text-sm leading-6 text-zinc-600">
							{product.description.en}
						</p>
						<div
							className={`mt-8 p-4 text-sm ${energy ? "rounded-xl border-2 border-zinc-950 bg-yellow-100" : "border-y border-zinc-300"}`}
						>
							<strong>Weekly observation</strong>
							<p className="mt-1 text-zinc-600">
								Seen in {product.regions?.join(", ")}. Availability can vary by
								location.
							</p>
						</div>
						<a
							href={product.url}
							className={`mt-8 inline-flex px-5 py-3 text-sm font-semibold ${energy ? "rounded-xl bg-zinc-950 text-white shadow-[4px_4px_0_#f97316]" : "rounded-full border border-zinc-950"}`}
						>
							View source store ↗
						</a>
					</div>
				</div>
			</section>
		</main>
	);
}

function PrototypeSwitcher({
	variant,
	state,
	onStateChange,
}: {
	variant: CatalogPrototypeVariant;
	state: ListingState;
	onStateChange: (state: ListingState) => void;
}) {
	const targetFor = (offset: number) => {
		const current = catalogPrototypeVariants.indexOf(variant);
		return catalogPrototypeVariants[
			(current + offset + catalogPrototypeVariants.length) %
				catalogPrototypeVariants.length
		];
	};
	const previousRef = useRef<HTMLAnchorElement>(null);
	const nextRef = useRef<HTMLAnchorElement>(null);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement;
			if (
				["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
				target.isContentEditable
			)
				return;
			if (event.key === "ArrowLeft") previousRef.current?.click();
			if (event.key === "ArrowRight") nextRef.current?.click();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	if (import.meta.env.PROD) return null;

	return (
		<div className="fixed bottom-4 left-1/2 z-80 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/20 bg-zinc-950 p-2 text-white shadow-2xl">
			<Link
				ref={previousRef}
				to="/"
				search={(previous) => ({ ...previous, variant: targetFor(-1) })}
				replace
				reloadDocument
				className="rounded-xl p-2 hover:bg-white/10"
			>
				<ChevronLeft className="size-5" />
				<span className="sr-only">Previous direction</span>
			</Link>
			<p className="min-w-0 flex-1 truncate text-center text-xs font-semibold sm:text-sm">
				{variant === "editorial" ? "A" : "B"} — {variantNames[variant]}
			</p>
			<select
				aria-label="Preview state"
				value={state}
				onChange={(event) => onStateChange(event.target.value as ListingState)}
				className="rounded-lg bg-white/10 px-2 py-1.5 text-xs"
			>
				<option value="results" className="text-black">
					Results
				</option>
				<option value="empty" className="text-black">
					Empty
				</option>
				<option value="no-match" className="text-black">
					No match
				</option>
				<option value="error" className="text-black">
					Error
				</option>
			</select>
			<Link
				ref={nextRef}
				to="/"
				search={(previous) => ({ ...previous, variant: targetFor(1) })}
				replace
				reloadDocument
				className="rounded-xl p-2 hover:bg-white/10"
			>
				<ChevronRight className="size-5" />
				<span className="sr-only">Next direction</span>
			</Link>
		</div>
	);
}

/** Two catalog directions, switchable via `?variant=`, on the existing `/` route. */
export default function CatalogDirectionsPrototype({
	variant,
}: CatalogDirectionsPrototypeProps) {
	const [listingState, setListingState] = useState<ListingState>("results");
	const [filterOpen, setFilterOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<PublicProduct>();
	const products = useMemo(() => activeProducts, []);

	const content = selectedProduct ? (
		<ProductDetail
			product={selectedProduct}
			variant={variant}
			onBack={() => setSelectedProduct(undefined)}
		/>
	) : variant === "editorial" ? (
		<EditorialDirection
			products={products}
			state={listingState}
			onFilter={() => setFilterOpen(true)}
			onSelect={setSelectedProduct}
		/>
	) : (
		<EnergyDirection
			products={products}
			state={listingState}
			onFilter={() => setFilterOpen(true)}
			onSelect={setSelectedProduct}
		/>
	);

	return (
		<>
			{content}
			<FilterDialog
				open={filterOpen}
				onClose={() => setFilterOpen(false)}
				energy={variant === "energy"}
			/>
			<PrototypeSwitcher
				variant={variant}
				state={listingState}
				onStateChange={(next) => {
					setSelectedProduct(undefined);
					setListingState(next);
				}}
			/>
		</>
	);
}
