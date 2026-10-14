import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ProductFilters } from "@/features/products/data/product-queries";
import {
	Category,
	REGIONS,
	Store,
} from "@/features/products/products.contracts";
import {
	categoryLabelKeys,
	regionLabelKeys,
	storeLabelKeys,
} from "../model/product-labels";

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
	const dialog = useRef<HTMLDialogElement>(null);
	const id = useId();
	const priceIntegerValid = [filters.minPrice, filters.maxPrice].every(
		(value) => value === undefined || (Number.isInteger(value) && value >= 0),
	);
	const priceRangeValid =
		filters.minPrice === undefined ||
		filters.maxPrice === undefined ||
		filters.minPrice <= filters.maxPrice;
	const isPriceValid = priceIntegerValid && priceRangeValid;

	useEffect(() => {
		if (isFilterOpen) dialog.current?.showModal();
		else dialog.current?.close();
	}, [isFilterOpen]);

	return (
		<>
			<button
				type="button"
				className="catalog-button"
				aria-haspopup="dialog"
				aria-controls={id}
				aria-expanded={isFilterOpen}
				onClick={() => setIsFilterOpen(true)}
			>
				<SlidersHorizontal size={18} aria-hidden="true" />
				{t("product.filters.title")}
			</button>
			<dialog
				ref={dialog}
				id={id}
				aria-labelledby={`${id}-title`}
				className="catalog-filter-dialog"
				onClose={() => setIsFilterOpen(false)}
				onCancel={() => setIsFilterOpen(false)}
			>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (isPriceValid) {
							onApply(filters);
							setIsFilterOpen(false);
						}
					}}
				>
					<div className="catalog-dialog-heading">
						<h2 id={`${id}-title`}>{t("product.filters.title")}</h2>
						<button
							type="button"
							className="catalog-icon-button"
							aria-label={t("product.filters.hide")}
							onClick={() => setIsFilterOpen(false)}
						>
							<X size={20} />
						</button>
					</div>
					<div className="catalog-dialog-content">
						{(
							[
								{
									field: "stores",
									title: "stores",
									options: Object.values(Store).map((value) => ({
										value,
										label: storeLabelKeys[value],
									})),
								},
								{
									field: "categories",
									title: "categories",
									options: Object.values(Category).map((value) => ({
										value,
										label: categoryLabelKeys[value],
									})),
								},
								{
									field: "regions",
									title: "regions",
									options: REGIONS.map((value) => ({
										value,
										label: regionLabelKeys[value],
									})),
								},
							] as const
						).map((group) => (
							<fieldset key={group.field}>
								<legend>{t(`product.filters.${group.title}`)}</legend>
								<div className="catalog-filter-options">
									{group.options.map(({ value: option, label }) => {
										const selected: readonly string[] =
											filters[group.field] ?? [];
										return (
											<label
												key={option}
												data-selected={selected.includes(option)}
											>
												<input
													type="checkbox"
													checked={selected.includes(option)}
													onChange={() =>
														setFilters({
															...filters,
															[group.field]: selected.includes(option)
																? selected.filter((value) => value !== option)
																: [...selected, option],
														})
													}
												/>
												{t(label)}
											</label>
										);
									})}
								</div>
							</fieldset>
						))}
						<fieldset>
							<legend>{t("product.filters.price")}</legend>
							<div className="catalog-price-inputs">
								{(["minPrice", "maxPrice"] as const).map((field) => (
									<label key={field}>
										<span>{t(`product.filters.${field}`)}</span>
										<input
											type="number"
											min={0}
											step={1}
											inputMode="numeric"
											value={filters[field] ?? ""}
											aria-invalid={!isPriceValid}
											aria-describedby={
												!isPriceValid ? `${id}-price-error` : undefined
											}
											onChange={(event) =>
												setFilters({
													...filters,
													[field]:
														event.target.value === ""
															? undefined
															: Number(event.target.value),
												})
											}
										/>
									</label>
								))}
							</div>
							{!isPriceValid ? (
								<p
									id={`${id}-price-error`}
									role="alert"
									className="mt-3 text-sm text-destructive"
								>
									{t(
										priceIntegerValid
											? "product.filters.priceRangeError"
											: "product.filters.priceIntegerError",
									)}
								</p>
							) : null}
						</fieldset>
						<label className="catalog-upcoming">
							<input
								type="checkbox"
								checked={filters.includeSoon ?? false}
								onChange={(event) =>
									setFilters({ ...filters, includeSoon: event.target.checked })
								}
							/>
							{t("product.filters.includeSoon")}
						</label>
					</div>
					<div className="catalog-dialog-footer">
						<button type="button" className="catalog-button" onClick={onReset}>
							{t("product.filters.reset")}
						</button>
						<button
							type="submit"
							className="catalog-button catalog-button-primary"
							disabled={!isPriceValid}
						>
							{t("product.filters.apply")}
						</button>
					</div>
				</form>
			</dialog>
		</>
	);
}
