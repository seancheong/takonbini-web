import { X } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import type { PublicProduct } from "@/@types/product";
import type { PrototypeStore } from "./prototypeData";
import { storeNames } from "./prototypeData";
import { useModalAccessibility } from "./useModalAccessibility";

export type PrototypeFilters = {
	stores: Exclude<PrototypeStore, "All">[];
	categories: string[];
	maxPrice: number;
};

export const initialPrototypeFilters: PrototypeFilters = {
	stores: [],
	categories: [],
	maxPrice: 1000,
};

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

export function filterPrototypeProducts(
	products: readonly PublicProduct[],
	query: string,
	filters: PrototypeFilters,
) {
	const needle = query.trim().toLocaleLowerCase();
	return products.filter((product) => {
		const searchable = [
			product.title.en,
			product.title.ja,
			product.category,
			storeNames[product.store],
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

export function filterCount(filters: PrototypeFilters) {
	return (
		filters.stores.length +
		filters.categories.length +
		(filters.maxPrice < 1000 ? 1 : 0)
	);
}

type Props = {
	draft: PrototypeFilters;
	setDraft: Dispatch<SetStateAction<PrototypeFilters>>;
	onApply: () => void;
	onClose: () => void;
};

export function PrototypeFilterSheet({
	draft,
	setDraft,
	onApply,
	onClose,
}: Props) {
	const [open, setOpen] = useState(true);
	const requestClose = () => setOpen(false);
	const dialogRef = useModalAccessibility(requestClose);
	const finishClose = () => {
		if (!open) onClose();
	};

	return (
		<div className="proto-filter-layer" data-state={open ? "open" : "closed"}>
			<button
				type="button"
				className="proto-filter-backdrop"
				aria-label="Close filters"
				onClick={requestClose}
				tabIndex={-1}
			/>
			<section
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label="Catalog filters"
				className="proto-filter-sheet"
				data-state={open ? "open" : "closed"}
				onTransitionEnd={(event) => {
					if (event.target === event.currentTarget) finishClose();
				}}
			>
				<header>
					<div>
						<span lang="ja">絞り込み</span>
						<h2>Refine the shelf</h2>
					</div>
					<button
						type="button"
						onClick={requestClose}
						aria-label="Close"
						data-autofocus
					>
						<X />
					</button>
				</header>
				<fieldset>
					<legend>Store</legend>
					<div className="proto-filter-options">
						{storeOptions.map((store) => (
							<label key={store}>
								<input
									type="checkbox"
									checked={draft.stores.includes(store)}
									onChange={() =>
										setDraft((current) => ({
											...current,
											stores: toggle(current.stores, store),
										}))
									}
								/>
								{storeNames[store]}
							</label>
						))}
					</div>
				</fieldset>
				<fieldset>
					<legend>What are you craving?</legend>
					<div className="proto-filter-categories">
						{categoryOptions.map((category) => (
							<label key={category}>
								<input
									type="checkbox"
									checked={draft.categories.includes(category)}
									onChange={() =>
										setDraft((current) => ({
											...current,
											categories: toggle(current.categories, category),
										}))
									}
								/>
								{category}
							</label>
						))}
					</div>
				</fieldset>
				<label className="proto-filter-price">
					Maximum price · ¥{draft.maxPrice}
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
					Show matching products
				</button>
			</section>
		</div>
	);
}
