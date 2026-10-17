import "../model/catalog-navigation";
import * as stylex from "@stylexjs/stylex";
import { CatchBoundary } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Suspense, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { colors } from "../../../styles/colors.stylex";
import ProductDetailError from "../detail/ProductDetailError";
import ProductDetailPending from "../detail/ProductDetailPending";
import ProductDetailScreen from "../detail/ProductDetailScreen";
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
		const focused = document.activeElement;
		const scrollY = window.scrollY;
		const previousOverflow = document.body.style.overflow;
		dialog.current?.showModal();
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
			if (focused instanceof HTMLElement)
				focused.focus({ preventScroll: true });
			requestAnimationFrame(() =>
				window.scrollTo({ top: scrollY, behavior: "instant" }),
			);
		};
	}, []);
	const title =
		product?.title[i18n.language as "en" | "ja" | "zh"] ??
		product?.title.ja ??
		t("product.details.fullDetails");
	return (
		<dialog
			ref={dialog}
			aria-label={title}
			{...stylex.props(styles.dialog)}
			onClose={onClose}
			onPointerDown={(event) => {
				pressedBackdrop.current = isBackdrop(event);
			}}
			onPointerUp={(event) => {
				if (pressedBackdrop.current && isBackdrop(event))
					dialog.current?.close();
				pressedBackdrop.current = false;
			}}
		>
			<div {...stylex.props(styles.content)}>
				<button
					type="button"
					{...stylex.props(styles.close)}
					aria-label={t("product.details.close")}
					onClick={() => dialog.current?.close()}
				>
					<X size={20} />
				</button>
				<CatchBoundary
					getResetKey={() => id}
					errorComponent={() => <ProductDetailError filters={filters} />}
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
		maxHeight: "calc(100dvh - 48px)",
		padding: 0,
		border: "1px solid",
		borderColor: colors.border,
		borderRadius: "8px",
		backgroundColor: colors.background,
		color: colors.foreground,
		overflowY: "auto",
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
