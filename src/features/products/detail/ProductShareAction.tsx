import * as stylex from "@stylexjs/stylex";
import {
	Check,
	ChevronLeft,
	ChevronRight,
	CircleAlert,
	Copy,
	Mail,
	Share2,
	X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Language } from "@/localization";
import { colors } from "../../../styles/colors.stylex";
import { getProductShareUrl } from "../model/product-sharing";
import { shareBrandPaths } from "./share-brand-paths";

export default function ProductShareAction({
	productId,
	language,
	title,
}: {
	productId: string;
	language: Language;
	title: string;
}) {
	const { t } = useTranslation();
	const headingId = useId();
	const inputId = useId();
	const dialog = useRef<HTMLDialogElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const backdropPressed = useRef(false);
	const destinationsRef = useRef<HTMLDivElement>(null);
	const [edges, setEdges] = useState({ start: true, end: true });
	const [url, setUrl] = useState("");
	const [expanded, setExpanded] = useState(false);
	const [nativeSharing, setNativeSharing] = useState(false);
	const [status, setStatus] = useState<"idle" | "sharing" | "copied" | "error">(
		"idle",
	);
	useEffect(() => {
		if (!expanded) return;
		const element = dialog.current;
		const previousOverflow = document.documentElement.style.overflow;
		element?.showModal();
		const row = destinationsRef.current;
		const updateEdges = () => {
			if (row)
				setEdges({
					start: row.scrollLeft <= 1,
					end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 1,
				});
		};
		updateEdges();
		row?.addEventListener("scroll", updateEdges, { passive: true });
		window.addEventListener("resize", updateEdges);
		document.documentElement.style.overflow = "hidden";
		return () => {
			row?.removeEventListener("scroll", updateEdges);
			window.removeEventListener("resize", updateEdges);
			element?.close();
			document.documentElement.style.overflow = previousOverflow;
			trigger.current?.focus({ preventScroll: true });
		};
	}, [expanded]);
	function scrollDestinations(direction: -1 | 1) {
		const row = destinationsRef.current;
		if (!row) return;
		row.scrollBy({ left: direction * 276, behavior: "instant" });
		const end = row.scrollLeft + row.clientWidth >= row.scrollWidth - 1;
		const start = row.scrollLeft <= 1;
		if ((direction === 1 && end) || (direction === -1 && start)) {
			const actions = row.querySelectorAll<
				HTMLAnchorElement | HTMLButtonElement
			>("a,button");
			(direction === 1 ? actions[actions.length - 1] : actions[0])?.focus();
		}
	}

	function open() {
		setUrl(getProductShareUrl(window.location.origin, productId, language));
		setNativeSharing(typeof navigator.share === "function");
		setStatus("idle");
		setExpanded(true);
	}
	async function copyLink() {
		setStatus("sharing");
		try {
			await navigator.clipboard.writeText(url);
			setStatus("copied");
		} catch {
			setStatus("error");
		}
	}
	async function share() {
		setStatus("sharing");
		try {
			await navigator.share({ title, url });
			setStatus("idle");
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") {
				setStatus("idle");
				return;
			}
			await copyLink();
		}
	}
	const destinations = [
		{
			name: "Facebook",
			brand: "facebook",
			href: `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}`,
		},
		{
			name: "WhatsApp",
			brand: "whatsapp",
			href: `https://wa.me/?${new URLSearchParams({ text: `${title} ${url}` })}`,
		},
		{
			name: "X",
			brand: "x",
			href: `https://twitter.com/intent/tweet?${new URLSearchParams({ url, text: title })}`,
		},
	] as const;
	function isBackdrop(event: React.PointerEvent<HTMLDialogElement>) {
		const bounds = event.currentTarget.getBoundingClientRect();
		return (
			event.target === event.currentTarget &&
			(event.clientX < bounds.left ||
				event.clientX > bounds.right ||
				event.clientY < bounds.top ||
				event.clientY > bounds.bottom)
		);
	}
	return (
		<>
			<button
				ref={trigger}
				type="button"
				aria-haspopup="dialog"
				onClick={open}
				{...stylex.props(styles.share)}
			>
				<Share2 size={16} aria-hidden="true" />
				{t("product.details.share")}
			</button>
			{expanded && (
				<dialog
					ref={dialog}
					aria-labelledby={headingId}
					onCancel={(event) => {
						event.preventDefault();
						event.stopPropagation();
						setExpanded(false);
					}}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							event.preventDefault();
							event.stopPropagation();
							setExpanded(false);
						}
					}}
					onPointerDown={(event) => {
						backdropPressed.current = isBackdrop(event);
					}}
					onPointerUp={(event) => {
						if (backdropPressed.current && isBackdrop(event))
							setExpanded(false);
						backdropPressed.current = false;
					}}
					{...stylex.props(styles.dialog)}
				>
					<div {...stylex.props(styles.content)}>
						<div {...stylex.props(styles.headingRow)}>
							<h2 id={headingId} {...stylex.props(styles.heading)}>
								{t("product.details.share")}
							</h2>
							<button
								type="button"
								aria-label={t("product.details.closeShare")}
								onClick={() => setExpanded(false)}
								{...stylex.props(styles.close)}
							>
								<X size={20} aria-hidden="true" />
							</button>
						</div>
						<div {...stylex.props(styles.destinationStrip)}>
							<div ref={destinationsRef} {...stylex.props(styles.destinations)}>
								{destinations.map(({ name, brand, href }) => (
									<a
										key={brand}
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										{...stylex.props(styles.destination)}
									>
										<span {...stylex.props(styles.circle, styles[brand])}>
											<svg
												viewBox="0 0 24 24"
												width="28"
												height="28"
												fill="currentColor"
												aria-hidden="true"
											>
												<path d={shareBrandPaths[brand]} />
											</svg>
										</span>
										<span>{name}</span>
									</a>
								))}

								<a
									href={`mailto:?${new URLSearchParams({ subject: title, body: url }).toString().replaceAll("+", "%20")}`}
									{...stylex.props(styles.destination)}
								>
									<span {...stylex.props(styles.circle)}>
										<Mail size={28} aria-hidden="true" />
									</span>
									<span>{t("product.details.shareEmail")}</span>
								</a>
								{nativeSharing && (
									<button
										type="button"
										disabled={status === "sharing"}
										aria-busy={status === "sharing"}
										onClick={share}
										{...stylex.props(styles.destination)}
									>
										<span {...stylex.props(styles.circle)}>
											<Share2 size={26} aria-hidden="true" />
										</span>
										<span>{t("product.details.moreApps")}</span>
									</button>
								)}
							</div>

							{!edges.start && (
								<button
									type="button"
									aria-label={t("product.details.previousShareOptions")}
									onClick={() => scrollDestinations(-1)}
									{...stylex.props(
										styles.close,
										styles.scrollArrow,
										styles.previous,
									)}
								>
									<ChevronLeft size={24} aria-hidden="true" />
								</button>
							)}
							{!edges.end && (
								<button
									type="button"
									aria-label={t("product.details.moreShareOptions")}
									onClick={() => scrollDestinations(1)}
									{...stylex.props(
										styles.close,
										styles.scrollArrow,
										styles.next,
									)}
								>
									<ChevronRight size={24} aria-hidden="true" />
								</button>
							)}
						</div>
						<div
							{...stylex.props(
								styles.linkRow,
								status === "error" && styles.errorBorder,
							)}
						>
							<input
								id={inputId}
								aria-label={t("product.details.shareLink")}
								type="url"
								value={url}
								readOnly
								autoComplete="off"
								spellCheck={false}
								onFocus={(event) => event.currentTarget.select()}
								{...stylex.props(styles.input)}
							/>
							<button
								type="button"
								disabled={status === "sharing"}
								onClick={() => copyLink()}
								{...stylex.props(styles.share, styles.copy)}
							>
								{status === "copied" ? (
									<Check size={16} aria-hidden="true" />
								) : (
									<Copy size={16} aria-hidden="true" />
								)}
								{t("product.details.copyLink")}
							</button>
						</div>
						<output
							aria-live="polite"
							{...stylex.props(
								styles.feedback,
								status === "error" && styles.error,
							)}
						>
							{status === "error" && (
								<CircleAlert
									size={16}
									aria-hidden="true"
									{...stylex.props(styles.statusIcon)}
								/>
							)}
							{status === "sharing"
								? t("product.details.sharing")
								: status === "copied"
									? t("product.details.linkCopied")
									: status === "error"
										? t("product.details.shareCopyError")
										: ""}
						</output>
					</div>
				</dialog>
			)}
		</>
	);
}
const styles = stylex.create({
	share: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "8px",
		minHeight: "44px",
		minWidth: "44px",
		paddingBlock: "10px",
		paddingInline: "14px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		borderRadius: "6px",
		backgroundColor: {
			default: colors.card,
			":active": colors.secondary,
			"@media (hover: hover) and (pointer: fine)": {
				":hover": colors.secondary,
			},
		},
		color: { default: colors.foreground, ":disabled": colors.mutedForeground },
		textDecoration: "none",
		fontFamily: "inherit",
		fontSize: "14px",
		fontWeight: 500,
		lineHeight: 1.4,
		cursor: { default: "pointer", ":disabled": "wait" },
		touchAction: "manipulation",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "2px",
	},

	dialog: {
		margin: "auto",
		width: "640px",
		maxWidth: "calc(100vw - 32px)",
		maxHeight: "calc(100dvh - 32px)",
		padding: 0,
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		borderRadius: "16px",
		backgroundColor: colors.card,
		color: colors.foreground,
		overflow: "auto",
		"::backdrop": { backgroundColor: colors.dialogBackdrop },
	},
	content: {
		display: "flex",
		flexDirection: "column",
		gap: "24px",
		padding: "24px",
		"@media (max-width: 420px)": { padding: "20px", gap: "20px" },
	},
	headingRow: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "16px",
	},
	heading: { margin: 0, fontSize: "20px", fontWeight: 600, lineHeight: 1.3 },
	close: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		width: "44px",
		height: "44px",
		padding: 0,
		borderWidth: 0,
		borderRadius: "50%",
		backgroundColor: {
			default: "transparent",
			":active": colors.secondary,
			"@media (hover: hover) and (pointer: fine)": {
				":hover": colors.secondary,
			},
		},
		color: colors.foreground,
		cursor: "pointer",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "2px",
	},
	destinationStrip: { position: "relative", minWidth: 0 },
	scrollArrow: {
		position: "absolute",
		top: "16px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		backgroundColor: colors.card,
	},
	previous: { left: "-10px" },
	next: { right: "-10px" },
	destinations: {
		display: "flex",
		gap: "8px",
		overflowX: "auto",
		paddingBlock: "4px",
		paddingInline: "2px",
		scrollbarWidth: "none",
		"::-webkit-scrollbar": { display: "none" },
		alignItems: "flex-start",
	},
	destination: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: "8px",
		flexShrink: 0,
		width: "84px",
		minHeight: "104px",
		padding: "4px",
		borderWidth: 0,
		borderRadius: "10px",
		backgroundColor: {
			default: "transparent",
			":active": colors.secondary,
			"@media (hover: hover) and (pointer: fine)": {
				":hover": colors.secondary,
			},
		},
		color: { default: colors.foreground, ":disabled": colors.mutedForeground },
		fontFamily: "inherit",
		fontSize: "13px",
		fontWeight: 400,
		lineHeight: 1.4,
		textAlign: "center",
		textDecoration: "none",
		touchAction: "manipulation",
		cursor: { default: "pointer", ":disabled": "wait" },
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "-2px",
	},
	circle: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: "60px",
		height: "60px",
		borderRadius: "50%",
		backgroundColor: colors.secondary,
		color: colors.foreground,
		flexShrink: 0,
	},
	facebook: {
		backgroundColor: colors.shareFacebook,
		color: colors.shareBrandForeground,
	},
	whatsapp: {
		backgroundColor: colors.shareWhatsApp,
		color: colors.shareBrandForeground,
	},
	x: { backgroundColor: colors.shareX, color: colors.shareBrandForeground },
	linkRow: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		padding: "6px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		borderRadius: "10px",
		backgroundColor: colors.background,
	},
	input: {
		flex: "1 1 0",
		minWidth: 0,
		width: "100%",
		minHeight: "44px",
		paddingInline: "10px",
		borderWidth: 0,
		borderRadius: "4px",
		backgroundColor: "transparent",
		color: colors.foreground,
		fontFamily: "inherit",
		fontSize: "16px",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "-2px",
	},
	copy: { flexShrink: 0, borderRadius: "6px" },
	error: { color: colors.errorText },
	errorBorder: { borderColor: colors.errorText },
	statusIcon: { flexShrink: 0, marginTop: "2px" },
	feedback: {
		display: "flex",
		alignItems: "flex-start",
		gap: "6px",
		minHeight: "40px",
		marginTop: "-12px",
		fontSize: "13px",
		lineHeight: 1.5,
		color: colors.mutedForeground,
	},
});
