import { SlidersHorizontal, X } from "lucide-react";
import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	Category,
	type Category as CategoryType,
	REGIONS,
	type Region,
	Store,
	type Store as StoreType,
} from "@/@types/product";
import {
	type CategoryLabelKey,
	categoryLabelKeys,
	type RegionLabelKey,
	regionLabelKeys,
	type StoreLabelKey,
	storeLabelKeys,
} from "@/features/product/utils/productLabels";
import type { ProductFilters } from "@/services/productService";

const toggleValue = <T extends string>(list: T[] | undefined, value: T) => {
	if (!list) return [value];
	return list.includes(value)
		? list.filter((item) => item !== value)
		: [...list, value];
};

interface ProductFilterDrawerProps {
	filters: ProductFilters;
	setFilters: (next: ProductFilters) => void;
	isFilterOpen: boolean;
	setIsFilterOpen: (open: boolean) => void;
	onApply: (filters: ProductFilters) => void;
	onReset: () => void;
}

export default function ProductFilterDrawer({
	filters,
	setFilters,
	isFilterOpen,
	setIsFilterOpen,
	onApply,
	onReset,
}: ProductFilterDrawerProps) {
	const { t } = useTranslation();
	const searchInputId = useId();

	const storeOptions = useMemo(() => Object.values(Store) as StoreType[], []);
	const categoryOptions = useMemo(
		() => Object.values(Category) as CategoryType[],
		[],
	);
	const regionOptions = useMemo(() => REGIONS as unknown as Region[], []);

	const minPriceValid =
		filters.minPrice === undefined || Number.isInteger(filters.minPrice);
	const maxPriceValid =
		filters.maxPrice === undefined || Number.isInteger(filters.maxPrice);
	const priceRangeValid =
		filters.minPrice === undefined ||
		filters.maxPrice === undefined ||
		filters.minPrice <= filters.maxPrice;
	const isPriceValid = minPriceValid && maxPriceValid && priceRangeValid;
	const activeFilterCount =
		[
			filters.search,
			filters.includeSoon,
			filters.minPrice,
			filters.maxPrice,
		].filter((value) => value !== undefined && value !== "").length +
		(filters.stores?.length ?? 0) +
		(filters.categories?.length ?? 0) +
		(filters.regions?.length ?? 0);

	return (
		<div className="filters-shell sticky top-15 z-40 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm ring-1 ring-primary/20 transition hover:ring-primary/40 backdrop-blur supports-backdrop-filter:bg-card/90">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<h2 className="text-base font-semibold text-foreground">
						{t("product.filters.title")}
					</h2>

					{activeFilterCount ? (
						<span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-primary-foreground">
							{t("product.filters.activeCount", {
								count: activeFilterCount,
							})}
						</span>
					) : null}
				</div>

				<button
					type="button"
					onClick={() => {
						setIsFilterOpen(!isFilterOpen);
					}}
					className={`flex w-42 items-center justify-center rounded-full px-4 py-1 text-sm font-semibold transition ${
						isFilterOpen
							? "border border-border/60 bg-muted text-foreground hover:border-border hover:bg-muted/80"
							: "bg-primary text-primary-foreground hover:bg-primary/90"
					}`}
				>
					<span className="inline-flex items-center gap-1.5">
						{isFilterOpen ? (
							<X className="h-3.5 w-3.5" aria-hidden="true" />
						) : (
							<SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
						)}
						{isFilterOpen
							? t("product.filters.hide")
							: t("product.filters.show")}
					</span>
				</button>
			</div>

			<form
				className={`overflow-hidden transition-all duration-300 ${
					isFilterOpen
						? "mt-4 max-h-[70vh] opacity-100"
						: "mt-0 max-h-0 opacity-0"
				}`}
				onSubmit={(event) => {
					event.preventDefault();
					if (!isPriceValid) return;
					onApply(filters);
					setIsFilterOpen(false);
				}}
			>
				<div
					className={`flex flex-col gap-5 ${
						isFilterOpen
							? "max-h-[calc(70vh-44px)] overflow-y-auto overscroll-contain pr-1"
							: ""
					}`}
				>
					<div className="flex flex-wrap pt-0.5 items-center gap-3">
						<label
							htmlFor={searchInputId}
							className="text-sm font-semibold text-foreground"
						>
							{t("product.filters.searchLabel")}
						</label>

						<input
							id={searchInputId}
							type="text"
							value={filters.search ?? ""}
							onChange={(event) =>
								setFilters({
									...filters,
									search: event.target.value,
								})
							}
							placeholder={t("product.filters.searchPlaceholder")}
							className="min-w-55 flex-1 rounded-full border border-border/60 bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						/>

						<label className="flex items-center gap-2 text-sm text-muted-foreground">
							<input
								type="checkbox"
								checked={filters.includeSoon ?? false}
								onChange={(event) =>
									setFilters({
										...filters,
										includeSoon: event.target.checked,
									})
								}
								className="checkbox-green h-4 w-4 focus:ring-(--success-accent)"
							/>
							{t("product.filters.includeSoon")}
						</label>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-xl border border-border/60 bg-background/80 p-4">
							<p className="text-sm font-semibold text-foreground">
								{t("product.filters.stores")}
							</p>

							<div className="mt-3 flex flex-wrap gap-2">
								{storeOptions.map((store) => {
									const key = storeLabelKeys[store];

									return (
										<label
											key={store}
											className="inline-flex items-center gap-2 bg-card/95 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-foreground"
										>
											<input
												type="checkbox"
												checked={filters.stores?.includes(store) ?? false}
												onChange={() =>
													setFilters({
														...filters,
														stores: toggleValue(filters.stores, store),
													})
												}
												className="checkbox-green h-4 w-4 focus:ring-(--success-accent)"
											/>
											{key ? t(key as StoreLabelKey) : store}
										</label>
									);
								})}
							</div>
						</div>

						<div className="rounded-xl border border-border/60 bg-background/80 p-4">
							<p className="text-sm font-semibold text-foreground">
								{t("product.filters.categories")}
							</p>

							<div className="mt-3 flex flex-wrap gap-2">
								{categoryOptions.map((category) => {
									const key = categoryLabelKeys[category];

									return (
										<label
											key={category}
											className="inline-flex items-center gap-2 bg-card/95 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-foreground"
										>
											<input
												type="checkbox"
												checked={
													filters.categories?.includes(category) ?? false
												}
												onChange={() =>
													setFilters({
														...filters,
														categories: toggleValue(
															filters.categories,
															category,
														),
													})
												}
												className="checkbox-green h-4 w-4 focus:ring-(--success-accent)"
											/>
											{key ? t(key as CategoryLabelKey) : category}
										</label>
									);
								})}
							</div>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="rounded-xl border border-border/60 bg-background/80 p-4">
							<p className="text-sm font-semibold text-foreground">
								{t("product.filters.regions")}
							</p>

							<div className="mt-3 flex flex-wrap gap-2">
								{regionOptions.map((region) => {
									const key = regionLabelKeys[region];

									return (
										<label
											key={region}
											className="inline-flex items-center gap-2 bg-card/95 rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-foreground"
										>
											<input
												type="checkbox"
												checked={filters.regions?.includes(region) ?? false}
												onChange={() =>
													setFilters({
														...filters,
														regions: toggleValue(filters.regions, region),
													})
												}
												className="checkbox-green h-4 w-4 focus:ring-(--success-accent)"
											/>
											{key ? t(key as RegionLabelKey) : region}
										</label>
									);
								})}
							</div>
						</div>

						<div className="rounded-xl border border-border/60 bg-background/80 p-4">
							<p className="text-sm font-semibold text-foreground">
								{t("product.filters.price")}
							</p>

							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								<input
									type="number"
									min={0}
									step={1}
									inputMode="numeric"
									value={filters.minPrice ?? ""}
									onChange={(event) =>
										setFilters({
											...filters,
											minPrice: event.target.value
												? Number(event.target.value)
												: undefined,
										})
									}
									placeholder={t("product.filters.minPrice")}
									className="w-full rounded-full border border-border/60 bg-card/95 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								/>

								<input
									type="number"
									min={0}
									step={1}
									inputMode="numeric"
									value={filters.maxPrice ?? ""}
									onChange={(event) =>
										setFilters({
											...filters,
											maxPrice: event.target.value
												? Number(event.target.value)
												: undefined,
										})
									}
									placeholder={t("product.filters.maxPrice")}
									className="w-full rounded-full border border-border/60 bg-card/95 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								/>
							</div>

							{!isPriceValid ? (
								<p className="mt-3 text-sm text-destructive">
									{!minPriceValid || !maxPriceValid
										? t("product.filters.priceIntegerError")
										: t("product.filters.priceRangeError")}
								</p>
							) : null}
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={() => {
								onReset();
							}}
							className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 dark:border-primary/60 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/30"
						>
							{t("product.filters.reset")}
						</button>

						<button
							type="submit"
							disabled={!isPriceValid}
							className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{t("product.filters.apply")}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
