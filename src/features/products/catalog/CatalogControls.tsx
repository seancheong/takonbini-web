import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProductFilters } from "@/features/products/data/product-queries";
import { Store } from "@/features/products/products.contracts";
import {
	categoryLabelKeys,
	regionLabelKeys,
	storeLabelKeys,
} from "../model/product-labels";

interface CatalogControlsProps {
	filters: ProductFilters;
	onApply: (filters: ProductFilters) => void;
	children: React.ReactNode;
}

export default function CatalogControls({
	filters,
	onApply,
	children,
}: CatalogControlsProps) {
	const { t } = useTranslation();
	const id = useId();
	const [search, setSearch] = useState(filters.search ?? "");
	useEffect(() => setSearch(filters.search ?? ""), [filters.search]);
	const chips: { id: string; label: string; remove: () => void }[] = [];
	if (filters.search)
		chips.push({
			id: "search",
			label: filters.search,
			remove: () => onApply({ ...filters, search: undefined }),
		});
	for (const store of filters.stores ?? [])
		chips.push({
			id: store,
			label: t(storeLabelKeys[store]),
			remove: () =>
				onApply({
					...filters,
					stores: filters.stores?.filter((value) => value !== store),
				}),
		});
	for (const category of filters.categories ?? [])
		chips.push({
			id: category,
			label: t(categoryLabelKeys[category]),
			remove: () =>
				onApply({
					...filters,
					categories: filters.categories?.filter((value) => value !== category),
				}),
		});
	for (const region of filters.regions ?? [])
		chips.push({
			id: region,
			label: t(regionLabelKeys[region]),
			remove: () =>
				onApply({
					...filters,
					regions: filters.regions?.filter((value) => value !== region),
				}),
		});
	for (const field of ["minPrice", "maxPrice"] as const)
		if (filters[field] !== undefined)
			chips.push({
				id: field,
				label: `${t(`product.filters.${field}`)}: ¥${filters[field]}`,
				remove: () => onApply({ ...filters, [field]: undefined }),
			});
	if (filters.includeSoon)
		chips.push({
			id: "soon",
			label: t("product.filters.includeSoon"),
			remove: () => onApply({ ...filters, includeSoon: undefined }),
		});

	return (
		<div className="catalog-controls">
			<div className="catalog-toolbar">
				<search>
					<form
						className="catalog-search"
						onSubmit={(event) => {
							event.preventDefault();
							onApply({ ...filters, search: search.trim() || undefined });
						}}
					>
						<label htmlFor={id}>{t("product.filters.searchLabel")}</label>
						<div>
							<Search size={20} aria-hidden="true" />
							<input
								id={id}
								type="search"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder={t("product.filters.searchPlaceholder")}
							/>
							<button
								type="submit"
								className="catalog-button catalog-button-primary"
							>
								{t("product.filters.searchLabel")}
							</button>
						</div>
					</form>
				</search>
				{children}
			</div>
			<fieldset className="catalog-store-picker">
				<legend className="sr-only">{t("product.filters.stores")}</legend>
				<button
					type="button"
					aria-pressed={!filters.stores?.length}
					onClick={() => onApply({ ...filters, stores: undefined })}
				>
					{t("product.allStores")}
				</button>
				{Object.values(Store).map((store) => (
					<button
						key={store}
						type="button"
						data-store={store}
						aria-pressed={filters.stores?.includes(store) ?? false}
						onClick={() => onApply({ ...filters, stores: [store] })}
					>
						{t(storeLabelKeys[store])}
					</button>
				))}
			</fieldset>
			{chips.length ? (
				<div className="catalog-applied">
					{chips.map((chip) => (
						<button
							type="button"
							key={chip.id}
							aria-label={t("product.removeFilter", { label: chip.label })}
							onClick={chip.remove}
						>
							{chip.label}
							<X size={14} aria-hidden="true" />
						</button>
					))}
					<button
						type="button"
						className="catalog-clear"
						onClick={() => onApply({ limit: filters.limit })}
					>
						{t("product.clearFilters")}
					</button>
				</div>
			) : null}
		</div>
	);
}
