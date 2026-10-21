import "../model/catalog-navigation";
import * as stylex from "@stylexjs/stylex";
import { CatchBoundary } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDialogDismiss } from "../../../hooks/useDialogDismiss";
import { resolveSupportedLanguage } from "../../../localization";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
import ProductDetailError from "../detail/ProductDetailError";
import ProductDetailPending from "../detail/ProductDetailPending";
import ProductDetailScreen from "../detail/ProductDetailScreen";
import { resolveProductText } from "../model/product-display";
import type {
	ActiveCatalogProduct,
	ProductFilters,
} from "../products.contracts";

interface ProductPreviewProps {
	id: string;
	product?: ActiveCatalogProduct;
	filters: ProductFilters;
	onClose: () => void;
}
export default function ProductPreview({
	id,
	product,
	filters,
	onClose,
}: ProductPreviewProps) {
	const { t, i18n } = useTranslation();
	const dialog = useRef<HTMLDialogElement>(null);
	const dismiss = useDialogDismiss(dialog);
	const requestClose = () => dismiss(() => dialog.current?.close());
	const pressedBackdrop = useRef(false);
	const isBackdrop = (event: React.PointerEvent<HTMLDialogElement>) => {
		const bounds = event.currentTarget.getBoundingClientRect();
		return (
			event.target === event.currentTarget &&
			(event.clientX < bounds.left ||
				event.clientX > bounds.right ||
				event.clientY < bounds.top ||
				event.clientY > bounds.bottom)
		);
	};
	useEffect(() => {
		const scrollY = window.scrollY;
		const previousOverflow = document.documentElement.style.overflow;
		dialog.current?.showModal();
		document.documentElement.style.overflow = "hidden";
		return () => {
			document.documentElement.style.overflow = previousOverflow;
			requestAnimationFrame(() =>
				window.scrollTo({ top: scrollY, behavior: "instant" }),
			);
		};
	}, []);
	const title = product
		? resolveProductText(
				product.title,
				resolveSupportedLanguage(i18n.language) ?? "en",
			).text
		: t("product.details.fullDetails");
	return (
		<dialog
			ref={dialog}
			data-slot="product-preview"
			aria-label={title}
			onCancel={(event) => {
				event.preventDefault();
				requestClose();
			}}
			{...stylex.props(styles.dialog)}
			onClose={onClose}
			onPointerDown={(event) => {
				pressedBackdrop.current = isBackdrop(event);
			}}
			onPointerUp={(event) => {
				if (pressedBackdrop.current && isBackdrop(event)) requestClose();
				pressedBackdrop.current = false;
			}}
		>
			<div {...stylex.props(styles.content)}>
				<div {...stylex.props(styles.closeBar)}>
					<button
						type="button"
						{...stylex.props(styles.close)}
						aria-label={t("product.details.close")}
						onClick={requestClose}
					>
						<X size={20} />
					</button>
				</div>
				<CatchBoundary
					getResetKey={() => id}
					errorComponent={({ reset }) => (
						<ProductDetailError
							id={id}
							filters={filters}
							onRecovered={() => {
								reset();
								dialog.current
									?.querySelector<HTMLButtonElement>("button")
									?.focus({ preventScroll: true });
							}}
						/>
					)}
				>
					<Suspense fallback={<ProductDetailPending modal />}>
						<ProductDetailScreen
							key={id}
							id={id}
							filters={filters}
							presentation="modal"
						/>
					</Suspense>
				</CatchBoundary>
			</div>
		</dialog>
	);
}
const styles = stylex.create({
	dialog: {
		margin: "auto",
		width: "min(1120px,calc(100% - 48px))",
		height: {
			default: "calc(100dvh - 48px)",
			[conditions.detailColumns]: "min(820px, calc(100dvh - 48px))",
		},
		maxHeight: "calc(100dvh - 48px)",
		padding: 0,
		border: "1px solid",
		borderColor: colors.border,
		borderRadius: "8px",
		backgroundColor: colors.background,
		color: colors.foreground,
		overflowY: "auto",
		scrollbarGutter: "stable",
		overscrollBehavior: "contain",
		"@media (max-width: 600px)": {
			width: "100vw",
			maxWidth: "100vw",
			height: "100dvh",
			maxHeight: "100dvh",
			borderRadius: 0,
			borderWidth: 0,
		},
	},
	content: { position: "relative", minHeight: "100%" },
	closeBar: { position: "sticky", top: 0, height: 0, zIndex: 2 },
	close: {
		position: "absolute",
		top: "12px",
		right: "12px",
		zIndex: 2,
		width: "44px",
		height: "44px",
		display: "grid",
		placeItems: "center",
		borderRadius: "50%",
		backgroundColor: colors.card,
		color: colors.foreground,
		border: "1px solid",
		borderColor: colors.border,
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "3px",
	},
});
