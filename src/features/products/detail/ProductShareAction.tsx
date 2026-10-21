import * as stylex from "@stylexjs/stylex";
import { Check, CircleAlert, Copy, Share2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Language } from "@/localization";
import { colors } from "../../../styles/colors.stylex";
import { getProductShareUrl } from "../model/product-sharing";

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
	const inputId = useId();
	const optionsId = useId();
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [url, setUrl] = useState("");
	const [expanded, setExpanded] = useState(false);
	const [nativeSharing, setNativeSharing] = useState(false);
	const [instagram, setInstagram] = useState(false);
	const [status, setStatus] = useState<"idle" | "sharing" | "copied" | "error">(
		"idle",
	);
	const [manualUrl, setManualUrl] = useState("");
	function toggle() {
		setUrl(getProductShareUrl(window.location.origin, productId, language));
		setNativeSharing(typeof navigator.share === "function");
		setExpanded(!expanded);
	}
	async function copyLink(forInstagram = false) {
		setInstagram(forInstagram);
		setStatus("sharing");
		try {
			await navigator.clipboard.writeText(url);
			setStatus("copied");
		} catch {
			setManualUrl(url);
			setStatus("error");
		}
	}

	async function share() {
		const url = getProductShareUrl(window.location.origin, productId, language);
		setStatus("sharing");
		if (typeof navigator.share === "function") {
			try {
				await navigator.share({ title, url });
				setStatus("idle");
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					setStatus("idle");
					return;
				}
			}
		}
		await copyLink();
	}
	return (
		<div {...stylex.props(styles.container)}>
			<button
				ref={triggerRef}
				type="button"
				aria-expanded={expanded}
				aria-controls={optionsId}
				onClick={toggle}
				{...stylex.props(styles.share)}
			>
				<Share2 size={16} aria-hidden="true" />
				{t("product.details.share")}
			</button>
			{expanded && (
				<section
					id={optionsId}
					aria-label={t("product.details.share")}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							event.stopPropagation();
							setExpanded(false);
							triggerRef.current?.focus();
						}
					}}
					{...stylex.props(styles.options)}
				>
					<div {...stylex.props(styles.destinations)}>
						<a
							href={`https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url })}`}
							target="_blank"
							rel="noopener noreferrer"
							{...stylex.props(styles.share)}
						>
							Facebook
						</a>
						<a
							href={`https://twitter.com/intent/tweet?${new URLSearchParams({ url, text: title })}`}
							target="_blank"
							rel="noopener noreferrer"
							{...stylex.props(styles.share)}
						>
							X
						</a>
						<button
							type="button"
							disabled={status === "sharing"}
							onClick={() => copyLink(true)}
							{...stylex.props(styles.share)}
						>
							Instagram{" "}
							<span {...stylex.props(styles.hint)}>
								{t("product.details.copyLink")}
							</span>
						</button>
						<button
							type="button"
							disabled={status === "sharing"}
							onClick={() => copyLink()}
							{...stylex.props(styles.share)}
						>
							{status === "copied" && !instagram ? (
								<Check size={16} aria-hidden="true" />
							) : (
								<Copy size={16} aria-hidden="true" />
							)}
							{t("product.details.copyLink")}
						</button>
					</div>
					{nativeSharing && (
						<button
							type="button"
							disabled={status === "sharing"}
							aria-busy={status === "sharing"}
							onClick={share}
							{...stylex.props(styles.share)}
						>
							<Share2 size={16} aria-hidden="true" />
							{t("product.details.moreApps")}
						</button>
					)}
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
								? t(
										instagram
											? "product.details.instagramCopied"
											: "product.details.linkCopied",
									)
								: status === "error"
									? t("product.details.shareCopyError")
									: ""}
					</output>
					{status === "error" && (
						<div {...stylex.props(styles.manual)}>
							<label htmlFor={inputId} {...stylex.props(styles.label)}>
								{t("product.details.shareLink")}
							</label>
							<input
								id={inputId}
								type="url"
								value={manualUrl}
								readOnly
								autoComplete="off"
								spellCheck={false}
								onFocus={(event) => event.currentTarget.select()}
								{...stylex.props(styles.input, styles.errorInput)}
							/>
						</div>
					)}
				</section>
			)}
		</div>
	);
}
const styles = stylex.create({
	container: {
		display: "flex",
		flexDirection: "column",
		alignItems: "flex-start",
		gap: "8px",
		minWidth: 0,
	},
	options: {
		display: "flex",
		flexDirection: "column",
		alignItems: "flex-start",
		gap: "12px",
		width: "100%",
		padding: "16px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		borderRadius: "8px",
		backgroundColor: colors.card,
	},
	destinations: { display: "flex", flexWrap: "wrap", gap: "8px" },
	hint: { color: colors.mutedForeground, fontSize: "12px", fontWeight: 400 },
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
	error: { color: colors.errorText },
	errorInput: { borderColor: colors.errorText },
	statusIcon: { flexShrink: 0, marginTop: "2px" },
	feedback: {
		display: "flex",
		alignItems: "flex-start",
		gap: "6px",
		minHeight: "40px",
		maxWidth: "65ch",
		fontSize: "13px",
		lineHeight: 1.5,
		color: colors.mutedForeground,
	},
	manual: {
		display: "flex",
		flexDirection: "column",
		gap: "6px",
		width: "100%",
		minWidth: 0,
	},
	label: { fontSize: "14px", fontWeight: 500, color: colors.foreground },
	input: {
		width: "100%",
		minWidth: 0,
		minHeight: "44px",
		padding: "10px",
		borderWidth: "1px",
		borderStyle: "solid",
		borderColor: colors.border,
		borderRadius: "6px",
		backgroundColor: colors.card,
		color: colors.foreground,
		fontSize: "16px",
		outline: { default: null, ":focus-visible": "2px solid var(--ring)" },
		outlineOffset: "2px",
	},
});
