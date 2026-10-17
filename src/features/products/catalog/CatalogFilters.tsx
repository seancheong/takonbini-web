import * as stylex from "@stylexjs/stylex";
import { SlidersHorizontal, X } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
	Category,
	REGIONS,
	Store,
} from "@/features/products/model/product-values";
import type { ProductFilters } from "@/features/products/products.contracts";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
import { metrics } from "../../../styles/metrics.stylex";
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
	const id = useId();
	const priceIntegerValid = [filters.minPrice, filters.maxPrice].every(
		(value) => value === undefined || (Number.isInteger(value) && value >= 0),
	);
	const priceRangeValid =
		filters.minPrice === undefined ||
		filters.maxPrice === undefined ||
		filters.minPrice <= filters.maxPrice;
	const isPriceValid = priceIntegerValid && priceRangeValid;
	return (
		<>
			<button
				type="button"
				aria-controls={id}
				aria-expanded={isFilterOpen}
				onClick={() => setIsFilterOpen(!isFilterOpen)}
				{...stylex.props(layoutStyles.open)}
			>
				<SlidersHorizontal size={18} aria-hidden="true" />
				{t("product.filters.title")}
			</button>
			{isFilterOpen && (
				<section
					id={id}
					aria-labelledby={`${id}-title`}
					{...stylex.props(layoutStyles.dialog)}
					data-slot="catalog-filter-dialog"
				>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							if (isPriceValid) {
								onApply(filters);
								setIsFilterOpen(false);
							}
						}}
						{...stylex.props(layoutStyles.form)}
					>
						<div {...stylex.props(layoutStyles.heading)}>
							<h2 id={`${id}-title`} {...stylex.props(layoutStyles.title)}>
								{t("product.filters.title")}
							</h2>
							<button
								type="button"
								aria-label={t("product.filters.hide")}
								onClick={() => setIsFilterOpen(false)}
								{...stylex.props(layoutStyles.close)}
							>
								<X size={20} />
							</button>
						</div>
						<div {...stylex.props(layoutStyles.content)}>
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
									<legend {...stylex.props(layoutStyles.legend)}>
										{t(`product.filters.${group.title}`)}
									</legend>
									<div {...stylex.props(layoutStyles.options)}>
										{group.options.map(({ value: option, label }) => {
											const selected: readonly string[] =
												filters[group.field] ?? [];
											return (
												<label
													key={option}
													data-selected={selected.includes(option)}
													{...stylex.props(layoutStyles.choice)}
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
														{...stylex.props(layoutStyles.checkbox)}
													/>
													{t(label)}
												</label>
											);
										})}
									</div>
								</fieldset>
							))}
							<fieldset>
								<legend {...stylex.props(layoutStyles.legend)}>
									{t("product.filters.price")}
								</legend>
								<div {...stylex.props(layoutStyles.prices)}>
									{(["minPrice", "maxPrice"] as const).map((field) => (
										<label
											key={field}
											{...stylex.props(layoutStyles.priceLabel)}
										>
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
												{...stylex.props(layoutStyles.priceInput)}
											/>
										</label>
									))}
								</div>
								{!isPriceValid ? (
									<p
										id={`${id}-price-error`}
										role="alert"
										{...stylex.props(layoutStyles.priceError)}
									>
										{t(
											priceIntegerValid
												? "product.filters.priceRangeError"
												: "product.filters.priceIntegerError",
										)}
									</p>
								) : null}
							</fieldset>
							<label {...stylex.props(layoutStyles.upcoming)}>
								<input
									type="checkbox"
									checked={filters.includeSoon ?? false}
									onChange={(event) =>
										setFilters({
											...filters,
											includeSoon: event.target.checked,
										})
									}
									{...stylex.props(layoutStyles.checkbox)}
								/>
								{t("product.filters.includeSoon")}
							</label>
						</div>
						<div {...stylex.props(layoutStyles.footer)}>
							<button
								type="button"
								onClick={onReset}
								{...stylex.props(layoutStyles.reset)}
							>
								{t("product.filters.reset")}
							</button>
							<button
								type="submit"
								disabled={!isPriceValid}
								{...stylex.props(layoutStyles.apply)}
							>
								{t("product.filters.apply")}
							</button>
						</div>
					</form>
				</section>
			)}
		</>
	);
}
const layoutStyles = stylex.create({
	open: {
		minHeight: "52px",
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "8px",
		padding: "0 16px",
		border: "1px solid",
		borderColor: { default: colors.border, ":hover": colors.mutedForeground },
		backgroundColor: colors.secondary,
		color: colors.secondaryForeground,
		borderRadius: "4px",
		fontSize: "13px",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
	},
	dialog: {
		gridColumn: "1 / -1",
		border: "1px solid",
		borderColor: colors.border,
		borderRadius: "4px",
		backgroundColor: colors.secondary,
		color: colors.foreground,
	},
	form: { display: "flex", flexDirection: "column" },
	heading: {
		display: "flex",
		flexShrink: 0,
		alignItems: "center",
		justifyContent: "space-between",
		gap: "1rem",
		paddingTop: "1rem",
		paddingRight: "1.5rem",
		paddingBottom: "1rem",
		paddingLeft: "1.5rem",
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: colors.border,
	},
	title: {
		fontSize: "1.25rem",
		fontWeight: 650,
	},
	close: {
		minHeight: "44px",
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "0.5rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderRadius: metrics.actionRadius,
		backgroundColor: {
			default: colors.card,
			":hover": colors.muted,
			":active": colors.accent,
		},
		paddingTop: "0.5rem",
		paddingRight: "0.5rem",
		paddingBottom: "0.5rem",
		paddingLeft: "0.5rem",
		fontSize: "0.85rem",
		fontWeight: 600,
		whiteSpace: "nowrap",
		transitionProperty: {
			default: "background-color, border-color",
			[conditions.reducedMotion]: "none",
		},
		transitionDuration: "150ms, 150ms",
		transitionTimingFunction: "ease",
		width: "44px",
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
		animationName: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
	content: {
		display: "grid",
		gridTemplateColumns: {
			default: "1fr",
			[conditions.detailColumns]: "repeat(2,minmax(0,1fr))",
		},
		padding: "24px",
		gap: "24px",
	},
	legend: {
		fontWeight: 650,
		marginBottom: "0.75rem",
		fontSize: "0.9rem",
	},
	options: {
		display: "flex",
		flexWrap: "wrap",
		gap: "0.5rem",
	},
	choice: {
		display: "inline-flex",
		gap: "0.5rem",
		alignItems: "center",
		minHeight: "44px",
		paddingTop: "0.5rem",
		paddingRight: "0.75rem",
		paddingBottom: "0.5rem",
		paddingLeft: "0.75rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: null,
			':is([data-selected="true"])': colors.foreground,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: null,
			':is([data-selected="true"])': colors.foreground,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: null,
			':is([data-selected="true"])': colors.foreground,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: null,
			':is([data-selected="true"])': colors.foreground,
		},
		borderRadius: "0.3rem",
		fontSize: "0.8rem",
		cursor: "pointer",
		backgroundColor: {
			default: null,
			':is([data-selected="true"])': colors.muted,
		},
	},
	checkbox: {
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
		width: {
			default: null,
			':is([type="checkbox"])': "16px",
		},
		height: {
			default: null,
			':is([type="checkbox"])': "16px",
		},
		accentColor: {
			default: null,
			':is([type="checkbox"])': colors.success,
		},
	},
	prices: {
		display: "grid",
		gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
		gap: "1rem",
	},
	priceLabel: {
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
		fontSize: "0.8rem",
	},
	priceInput: {
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
		width: {
			default: "100%",
			':is([type="checkbox"])': "16px",
		},
		height: {
			default: null,
			':is([type="checkbox"])': "16px",
		},
		accentColor: {
			default: null,
			':is([type="checkbox"])': colors.success,
		},
		minWidth: "0",
		minHeight: "44px",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: null,
			':is([aria-invalid="true"])': colors.destructive,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: null,
			':is([aria-invalid="true"])': colors.destructive,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: null,
			':is([aria-invalid="true"])': colors.destructive,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: null,
			':is([aria-invalid="true"])': colors.destructive,
		},
		borderRadius: "0.3rem",
		paddingTop: "0.6rem",
		paddingRight: "0.6rem",
		paddingBottom: "0.6rem",
		paddingLeft: "0.6rem",
		backgroundColor: colors.background,
		fontSize: "1rem",
	},
	priceError: {
		marginTop: "0.75rem",
		fontSize: "0.875rem",
		lineHeight: "1.25rem",
		color: colors.destructive,
	},
	upcoming: {
		display: "flex",
		alignItems: "center",
		gap: "0.75rem",
		minHeight: "44px",
		fontSize: "0.9rem",
	},
	footer: {
		display: "flex",
		flexShrink: 0,
		alignItems: "center",
		justifyContent: "space-between",
		gap: "1rem",
		paddingTop: "1rem",
		paddingRight: "1.5rem",
		paddingBottom: {
			default: "1rem",
			[conditions.compactCatalog]: "max(1rem, env(safe-area-inset-bottom))",
		},
		paddingLeft: "1.5rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: colors.border,
	},
	reset: {
		minHeight: "44px",
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "0.5rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: null,
			":hover": colors.mutedForeground,
		},
		borderRadius: metrics.actionRadius,
		backgroundColor: {
			default: colors.card,
			":hover": colors.muted,
			":active": colors.accent,
		},
		paddingTop: "0.65rem",
		paddingRight: "1rem",
		paddingBottom: "0.65rem",
		paddingLeft: "1rem",
		fontSize: "0.85rem",
		fontWeight: 600,
		whiteSpace: "nowrap",
		transitionProperty: {
			default: "background-color, border-color",
			[conditions.reducedMotion]: "none",
		},
		transitionDuration: "150ms, 150ms",
		transitionTimingFunction: "ease",
		opacity: {
			default: null,
			":disabled": 0.5,
		},
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
		animationName: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
	apply: {
		minHeight: "44px",
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "0.5rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: colors.foreground,
			":hover": colors.mutedForeground,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: colors.foreground,
			":hover": colors.mutedForeground,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: colors.foreground,
			":hover": colors.mutedForeground,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: colors.foreground,
			":hover": colors.mutedForeground,
		},
		borderRadius: metrics.actionRadius,
		backgroundColor: {
			default: colors.foreground,
			":hover": "color-mix(in oklch, var(--foreground) 85%, var(--background))",
			":active": colors.accent,
		},
		paddingTop: "0.65rem",
		paddingRight: "1rem",
		paddingBottom: "0.65rem",
		paddingLeft: "1rem",
		fontSize: "0.85rem",
		fontWeight: 600,
		whiteSpace: "nowrap",
		transitionProperty: {
			default: "background-color, border-color",
			[conditions.reducedMotion]: "none",
		},
		transitionDuration: "150ms, 150ms",
		transitionTimingFunction: "ease",
		opacity: {
			default: null,
			":disabled": 0.5,
		},
		color: colors.primaryForeground,
		outline: {
			default: null,
			":focus-visible": "2px solid var(--ring)",
		},
		outlineOffset: {
			default: null,
			":focus-visible": "3px",
		},
		animationName: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
});
