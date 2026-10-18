import * as SelectPrimitive from "@radix-ui/react-select";
import * as stylex from "@stylexjs/stylex";
import { clsx } from "clsx";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type * as React from "react";
import { colors } from "../../styles/colors.stylex";
import { conditions } from "../../styles/conditions.stylex";
import { metrics } from "../../styles/metrics.stylex";

function Select({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
	return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
	return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
	return (
		<SelectPrimitive.Value
			data-slot="select-value"
			{...stylex.props(styles.value)}
			{...props}
		/>
	);
}

function SelectTrigger({
	className,
	xstyle,
	style,
	size = "default",
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
	size?: "sm" | "default";
	xstyle?: stylex.StyleXStyles;
}) {
	const triggerStyle = stylex.props(
		styles.trigger,
		size === "sm" ? styles.small : styles.defaultSize,
		xstyle,
	);
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			data-size={size}
			{...triggerStyle}
			className={clsx(triggerStyle.className, className)}
			style={{ ...triggerStyle.style, ...style }}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDownIcon {...stylex.props(styles.icon, styles.chevron)} />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectContent({
	className,
	children,
	position = "item-aligned",
	align = "center",
	...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				data-slot="select-content"
				className={clsx(
					stylex.props(styles.content, position === "popper" && styles.popper)
						.className,
					className,
				)}
				position={position}
				align={align}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					{...stylex.props(
						styles.viewport,
						position === "popper" && styles.popperViewport,
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectLabel({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label
			data-slot="select-label"
			className={clsx(stylex.props(styles.label).className, className)}
			{...props}
		/>
	);
}

function SelectItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			className={clsx(stylex.props(styles.item).className, className)}
			{...props}
		>
			<span
				data-slot="select-item-indicator"
				{...stylex.props(styles.indicator)}
			>
				<SelectPrimitive.ItemIndicator>
					<CheckIcon {...stylex.props(styles.icon)} />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText {...stylex.props(styles.itemText)}>
				{children}
			</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator
			data-slot="select-separator"
			className={clsx(stylex.props(styles.separator).className, className)}
			{...props}
		/>
	);
}

function SelectScrollUpButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	return (
		<SelectPrimitive.ScrollUpButton
			data-slot="select-scroll-up-button"
			className={clsx(stylex.props(styles.scrollButton).className, className)}
			{...props}
		>
			<ChevronUpIcon {...stylex.props(styles.icon)} />
		</SelectPrimitive.ScrollUpButton>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	return (
		<SelectPrimitive.ScrollDownButton
			data-slot="select-scroll-down-button"
			className={clsx(stylex.props(styles.scrollButton).className, className)}
			{...props}
		>
			<ChevronDownIcon {...stylex.props(styles.icon)} />
		</SelectPrimitive.ScrollDownButton>
	);
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};

const enter = stylex.keyframes({
	from: { opacity: 0, transform: "translateY(-4px) scale(0.97)" },
	to: { opacity: 1, transform: "translateY(0) scale(1)" },
});
const exit = stylex.keyframes({
	to: { opacity: 0, transform: "translateY(-2px) scale(0.98)" },
});

const styles = stylex.create({
	value: {
		overflow: "hidden",
		display: "flex",
		WebkitBoxOrient: "vertical",
		WebkitLineClamp: 1,
		alignItems: "center",
		gap: "0.5rem",
	},
	itemText: { display: "flex", alignItems: "center", gap: "0.5rem" },
	trigger: {
		display: "flex",
		width: "fit-content",
		alignItems: "center",
		justifyContent: "space-between",
		gap: "0.5rem",
		borderRadius: "calc(var(--radius) - 2px)",
		borderWidth: 1,
		borderStyle: "solid",
		borderColor: {
			default: colors.input,
			":focus-visible": colors.ring,
			":is([aria-invalid=true])": colors.destructive,
			":is([aria-invalid=true]):focus-visible": colors.destructive,
		},
		backgroundColor: {
			default: "transparent",
			":is(.dark *)": "color-mix(in oklab, var(--input) 30%, transparent)",
			":is(.dark *):hover":
				"color-mix(in oklab, var(--input) 50%, transparent)",
		},
		color: {
			default: null,
			":is([data-placeholder])": colors.mutedForeground,
		},
		paddingInline: "0.75rem",
		paddingBlock: "0.5rem",
		fontSize: metrics.controlText,
		lineHeight: metrics.controlLine,
		whiteSpace: "nowrap",
		boxShadow: {
			default: "0 1px 2px 0 rgb(0 0 0 / .05)",
			":focus-visible":
				"0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent), 0 1px 2px 0 rgb(0 0 0 / .05)",
			":is([aria-invalid=true]):focus-visible":
				"0 0 0 3px color-mix(in oklab, var(--destructive) 20%, transparent), 0 1px 2px 0 rgb(0 0 0 / .05)",
			":is(.dark *)[aria-invalid=true]:focus-visible":
				"0 0 0 3px color-mix(in oklab, var(--destructive) 40%, transparent), 0 1px 2px 0 rgb(0 0 0 / .05)",
		},
		outlineStyle: "none",
		transitionProperty: "color, box-shadow",
		transitionDuration: {
			default: "150ms",
			[conditions.reducedMotion]: "0ms",
		},
		transitionTimingFunction: "cubic-bezier(.4, 0, .2, 1)",
		cursor: { default: null, ":disabled": "not-allowed" },
		opacity: { default: 1, ":disabled": 0.5 },
	},
	defaultSize: { height: "2.25rem" },
	small: { height: "2rem" },
	content: {
		position: "relative",
		zIndex: 50,
		maxHeight: "var(--radix-select-content-available-height)",
		animationName: {
			default: null,
			":is([data-state=open])": enter,
			":is([data-state=closed])": exit,
			[conditions.reducedMotion]: "none",
		},
		animationDuration: {
			default: "180ms",
			":is([data-state=closed])": "120ms",
		},
		animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
		minWidth: "8rem",
		transformOrigin: "var(--radix-select-content-transform-origin, top center)",
		overflowX: "hidden",
		overflowY: "auto",
		borderRadius: "calc(var(--radius) - 2px)",
		borderWidth: 1,
		borderStyle: "solid",
		borderColor: colors.border,
		backgroundColor: colors.popover,
		color: colors.popoverForeground,
		boxShadow: "0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1)",
	},
	popper: {
		translate: {
			default: null,
			":is([data-side=bottom])": "0 0.25rem",
			":is([data-side=top])": "0 -0.25rem",
			":is([data-side=left])": "-0.25rem 0",
			":is([data-side=right])": "0.25rem 0",
		},
	},
	viewport: { padding: "0.25rem" },
	popperViewport: {
		height: "var(--radix-select-trigger-height)",
		width: "100%",
		minWidth: "var(--radix-select-trigger-width)",
		scrollMarginBlock: "0.25rem",
	},
	label: {
		color: colors.mutedForeground,
		paddingInline: "0.5rem",
		paddingBlock: "0.375rem",
		fontSize: "0.75rem",
		lineHeight: "1rem",
	},
	item: {
		position: "relative",
		display: "flex",
		width: "100%",
		cursor: "default",
		alignItems: "center",
		gap: "0.5rem",
		borderRadius: "calc(var(--radius) - 4px)",
		paddingBlock: "0.375rem",
		paddingRight: "2rem",
		paddingLeft: "0.5rem",
		fontSize: metrics.controlText,
		lineHeight: metrics.controlLine,
		outlineStyle: {
			default: "none",
			"@media (forced-colors: active)": "solid",
		},
		outlineColor: {
			default: null,
			"@media (forced-colors: active)": "transparent",
		},
		outlineWidth: { default: null, "@media (forced-colors: active)": 2 },
		outlineOffset: { default: null, "@media (forced-colors: active)": 2 },
		userSelect: "none",
		backgroundColor: { default: null, ":focus": colors.accent },
		color: { default: null, ":focus": colors.accentForeground },
		pointerEvents: { default: null, ":is([data-disabled])": "none" },
		opacity: { default: 1, ":is([data-disabled])": 0.5 },
	},
	indicator: {
		position: "absolute",
		right: "0.5rem",
		display: "flex",
		width: "0.875rem",
		height: "0.875rem",
		alignItems: "center",
		justifyContent: "center",
	},
	icon: {
		color: colors.mutedForeground,
		width: "1rem",
		height: "1rem",
		flexShrink: 0,
		pointerEvents: "none",
	},
	chevron: { opacity: 0.5 },
	separator: {
		backgroundColor: colors.border,
		pointerEvents: "none",
		marginInline: "-0.25rem",
		marginBlock: "0.25rem",
		height: 1,
	},
	scrollButton: {
		display: "flex",
		cursor: "default",
		alignItems: "center",
		justifyContent: "center",
		paddingBlock: "0.25rem",
	},
});
