import * as stylex from "@stylexjs/stylex";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Category,
	REGIONS,
	Store,
} from "@/features/products/model/product-values";
import type { ProductFilters } from "@/features/products/products.contracts";
import { useDialogDismiss } from "../../../hooks/useDialogDismiss";
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
	activeCount?: number;
}
export default function ProductFilterDrawer({
	filters,
	setFilters,
	isFilterOpen,
	setIsFilterOpen,
	onApply,
	onReset,
	activeCount = 0,
}: ProductFilterDrawerProps) {
	const { t } = useTranslation();
	const id = useId();
	const [touched, setTouched] = useState({ minPrice: false, maxPrice: false });
	const [badInput, setBadInput] = useState({
		minPrice: false,
		maxPrice: false,
	});
	const dialog = useRef<HTMLDialogElement>(null);
	const dismiss = useDialogDismiss(dialog, 180);
	const requestClose = () => dismiss(() => setIsFilterOpen(false));
	useEffect(() => {
		if (!isFilterOpen) return;
		setTouched({ minPrice: false, maxPrice: false });
		setBadInput({ minPrice: false, maxPrice: false });
		const focused = document.activeElement;
		const previousOverflow = document.documentElement.style.overflow;
		dialog.current?.showModal();
		document.documentElement.style.overflow = "hidden";
		return () => {
			document.documentElement.style.overflow = previousOverflow;
			if (focused instanceof HTMLElement)
				focused.focus({ preventScroll: true });
		};
	}, [isFilterOpen]);
	const priceIntegerValid = [filters.minPrice, filters.maxPrice].every(
		(value) => value === undefined || (Number.isInteger(value) && value >= 0),
	);
	const priceRangeValid =
		filters.minPrice === undefined ||
		filters.maxPrice === undefined ||
		filters.minPrice <= filters.maxPrice;
	const isPriceValid = priceIntegerValid && priceRangeValid;
	const integerValid = (field: "minPrice" | "maxPrice") => {
		const value = filters[field];
		return (
			!badInput[field] &&
			(value === undefined || (Number.isInteger(value) && value >= 0))
		);
	};
	const minInvalid = touched.minPrice && !integerValid("minPrice");
	const maxInvalid =
		(touched.maxPrice && !integerValid("maxPrice")) ||
		(touched.maxPrice && !priceRangeValid);
	const showPriceError = minInvalid || maxInvalid;
	return (
		<>
			<button
				type="button"
				aria-controls={id}
				aria-haspopup="dialog"
				aria-label={
					activeCount > 0
						? `${t("product.filters.title")}, ${t("product.filters.activeCount", { count: activeCount })}`
						: undefined
				}
				aria-expanded={isFilterOpen}
				onClick={() => setIsFilterOpen(!isFilterOpen)}
				{...stylex.props(
					layoutStyles.open,
					isFilterOpen && layoutStyles.openActive,
				)}
			>
				<SlidersHorizontal size={18} aria-hidden="true" />
				{t("product.filters.title")}
				{activeCount > 0 && (
					<span {...stylex.props(layoutStyles.activeCount)} aria-hidden="true">
						{activeCount}
					</span>
				)}
			</button>
			{isFilterOpen && (
				<dialog
					ref={dialog}
					onCancel={(event) => {
						event.preventDefault();
						requestClose();
					}}
					onClose={() => setIsFilterOpen(false)}
					id={id}
					aria-labelledby={`${id}-title`}
					{...stylex.props(layoutStyles.dialog)}
					data-slot="catalog-filter-dialog"
				>
					<form
						noValidate
						onSubmit={(event) => {
							event.preventDefault();
							const invalidNative = Array.from(
								event.currentTarget.querySelectorAll<HTMLInputElement>(
									'input[type="number"]',
								),
							).find((input) => input.validity.badInput);
							if (invalidNative) {
								const field =
									invalidNative.name === "minPrice" ? "minPrice" : "maxPrice";
								setBadInput((previous) => ({ ...previous, [field]: true }));
								setTouched({ minPrice: true, maxPrice: true });
								invalidNative.focus();
								return;
							}
							if (isPriceValid && !badInput.minPrice && !badInput.maxPrice) {
								dismiss(() => {
									onApply(filters);
									setIsFilterOpen(false);
								});
							} else {
								setTouched({ minPrice: true, maxPrice: true });
								const field = !integerValid("minPrice")
									? "minPrice"
									: "maxPrice";
								event.currentTarget
									.querySelector<HTMLInputElement>(`[name="${field}"]`)
									?.focus();
							}
						}}
						{...stylex.props(layoutStyles.form)}
					>
						<div {...stylex.props(layoutStyles.heading)}>
							<div {...stylex.props(layoutStyles.headingCopy)}>
								<h2 id={`${id}-title`} {...stylex.props(layoutStyles.title)}>
									{t("product.filters.title")}
								</h2>
								<p {...stylex.props(layoutStyles.description)}>
									{t("product.filters.description")}
								</p>
							</div>
							<button
								type="button"
								aria-label={t("product.filters.hide")}
								onClick={requestClose}
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
								<fieldset
									key={group.field}
									{...stylex.props(layoutStyles.group)}
								>
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
							<fieldset {...stylex.props(layoutStyles.group)}>
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
												name={field}
												onBlur={() =>
													setTouched((previous) => ({
														...previous,
														[field]: true,
													}))
												}
												aria-invalid={
													field === "minPrice" ? minInvalid : maxInvalid
												}
												aria-describedby={
													(field === "minPrice" ? minInvalid : maxInvalid)
														? `${id}-price-error`
														: undefined
												}
												onChange={(event) => {
													const invalid = event.target.validity.badInput;
													setBadInput((previous) => ({
														...previous,
														[field]: invalid,
													}));
													setFilters({
														...filters,
														[field]:
															event.target.value === ""
																? undefined
																: Number(event.target.value),
													});
												}}
												{...stylex.props(layoutStyles.priceInput)}
											/>
										</label>
									))}
								</div>
								{showPriceError ? (
									<p
										id={`${id}-price-error`}
										role="alert"
										{...stylex.props(layoutStyles.priceError)}
									>
										{t(
											priceIntegerValid &&
												!badInput.minPrice &&
												!badInput.maxPrice
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
								onClick={() => {
									onReset();
									setTouched({ minPrice: false, maxPrice: false });
									setBadInput({ minPrice: false, maxPrice: false });
								}}
								{...stylex.props(layoutStyles.reset)}
							>
								{t("product.filters.reset")}
							</button>
							<button
								type="submit"
								data-slot="catalog-submit"
								{...stylex.props(layoutStyles.apply)}
							>
								{t("product.filters.apply")}
							</button>
						</div>
					</form>
				</dialog>
			)}
		</>
	);
}
const layoutStyles = stylex.create({
	activeCount: {
		display: "inline-grid",
		placeItems: "center",
		minWidth: "24px",
		height: "24px",
		paddingInline: "4px",
		borderRadius: "4px",
		backgroundColor: colors.secondary,
		color: colors.secondaryForeground,
		fontSize: "12px",
		fontVariantNumeric: "tabular-nums",
	},
	headingCopy: { display: "flex", flexDirection: "column", gap: "4px" },
	description: {
		fontSize: "13px",
		lineHeight: 1.5,
		color: colors.mutedForeground,
	},
	openActive: {
		borderColor: colors.primary,
		backgroundColor: colors.secondary,
		color: colors.secondaryForeground,
	},
	group: {
		minWidth: 0,
		padding: 0,
		margin: 0,
		border: 0,
	},
	open: {
		justifySelf: "start",
		height: "56px",
		transform: {
			default: "none",
			":active": "scale(0.96)",
			[conditions.reducedMotion]: "none",
		},
		minHeight: "56px",
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "8px",
		padding: "0 16px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: { default: colors.border, ":hover": colors.mutedForeground },
		backgroundColor: colors.card,
		color: colors.foreground,
		borderRadius: "4px",
		fontSize: "14px",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
	},
	dialog: {
		margin: { default: "auto", [conditions.compactCatalog]: "auto 0 0" },
		width: {
			default: "min(720px,calc(100% - 40px))",
			[conditions.compactCatalog]: "100%",
		},
		maxWidth: "none",
		maxHeight: {
			default: "min(860px,calc(100dvh - 64px))",
			[conditions.compactCatalog]: "calc(100dvh - 24px)",
		},
		padding: 0,
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		borderRadius: {
			default: "12px",
			[conditions.compactCatalog]: "16px 16px 0 0",
		},
		backgroundColor: colors.card,
		color: colors.foreground,
		overflow: "hidden",
	},
	form: {
		display: "flex",
		flexDirection: "column",
		maxHeight: {
			default: "min(860px,calc(100dvh - 64px))",
			[conditions.compactCatalog]: "calc(100dvh - 24px)",
		},
	},
	heading: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "16px",
		flexShrink: 0,
		padding: { default: "20px 24px", [conditions.compactCatalog]: "20px" },
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: colors.border,
	},
	title: {
		fontSize: "1.25rem",
		fontWeight: 650,
	},
	close: {
		minWidth: "44px",
		flexShrink: 0,
		transform: {
			default: "none",
			":active": "scale(0.96)",
			[conditions.reducedMotion]: "none",
		},
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
		display: "flex",
		flexDirection: "column",
		minHeight: 0,
		overflowY: "auto",
		overscrollBehavior: "contain",
		gap: "24px",
		padding: { default: "24px", [conditions.compactCatalog]: "20px" },
	},
	legend: {
		padding: 0,
		marginBottom: "12px",
		fontSize: "14px",
		fontWeight: 650,
		lineHeight: 1.5,
	},
	options: {
		display: "flex",
		flexWrap: "wrap",
		gap: "8px",
	},
	choice: {
		display: "inline-flex",
		gap: "8px",
		alignItems: "center",
		minHeight: "44px",
		padding: "10px 12px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: {
			default: colors.filterOptionBorder,
			":hover": colors.mutedForeground,
			':is([data-selected="true"])': colors.primary,
		},
		borderRadius: "6px",
		fontSize: "14px",
		fontWeight: 500,
		lineHeight: 1.5,
		cursor: "pointer",
		backgroundColor: {
			default: colors.card,
			":hover": colors.muted,
			':is([data-selected="true"])': colors.filterSelected,
		},
		transitionProperty: {
			default: "background-color, border-color",
			[conditions.reducedMotion]: "none",
		},
		transitionDuration: "150ms",
	},
	checkbox: {
		marginTop: 0,
		flexShrink: 0,
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
			':is([type="checkbox"])': colors.primary,
		},
	},
	prices: {
		display: "grid",
		gridTemplateColumns: "repeat(2,minmax(0,1fr))",
		gap: "16px",
	},
	priceLabel: {
		display: "flex",
		flexDirection: "column",
		gap: "0.5rem",
		fontSize: "14px",
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
			default: colors.input,
			':is([aria-invalid="true"])': colors.errorText,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: colors.input,
			':is([aria-invalid="true"])': colors.errorText,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: colors.input,
			':is([aria-invalid="true"])': colors.errorText,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: colors.input,
			':is([aria-invalid="true"])': colors.errorText,
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
		color: colors.errorText,
	},
	upcoming: {
		display: "flex",
		alignItems: "center",
		gap: "12px",
		minHeight: "44px",
		fontSize: "14px",
		paddingTop: "16px",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: colors.border,
	},
	footer: {
		display: "flex",
		backgroundColor: colors.card,
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
		transform: {
			default: "none",
			":active": "scale(0.96)",
			[conditions.reducedMotion]: "none",
		},
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
			default: "transparent",
			":hover": colors.muted,
			":active": colors.accent,
		},
		paddingTop: "0.65rem",
		paddingRight: "1rem",
		paddingBottom: "0.65rem",
		paddingLeft: "1rem",
		fontSize: "14px",
		color: colors.mutedForeground,
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
		transform: {
			default: "none",
			":active": "scale(0.96)",
			[conditions.reducedMotion]: "none",
		},
		minHeight: "44px",
		minWidth: { default: "auto", [conditions.tabletGrid]: "160px" },
		display: "inline-flex",
		justifyContent: "center",
		alignItems: "center",
		gap: "0.5rem",
		borderTopWidth: "1px",
		borderTopStyle: "solid",
		borderTopColor: {
			default: colors.primary,
			":hover": colors.mutedForeground,
		},
		borderRightWidth: "1px",
		borderRightStyle: "solid",
		borderRightColor: {
			default: colors.primary,
			":hover": colors.mutedForeground,
		},
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderBottomColor: {
			default: colors.primary,
			":hover": colors.mutedForeground,
		},
		borderLeftWidth: "1px",
		borderLeftStyle: "solid",
		borderLeftColor: {
			default: colors.primary,
			":hover": colors.mutedForeground,
		},
		borderRadius: metrics.actionRadius,
		backgroundColor: {
			default: colors.primary,
			":hover": "color-mix(in oklch, var(--primary) 88%, var(--foreground))",
			":active": "color-mix(in oklch, var(--primary) 88%, var(--foreground))",
		},
		paddingTop: "0.65rem",
		paddingRight: "1rem",
		paddingBottom: "0.65rem",
		paddingLeft: "1rem",
		fontSize: "14px",
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
