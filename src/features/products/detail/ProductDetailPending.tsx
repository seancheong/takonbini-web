import * as stylex from "@stylexjs/stylex";
import { colors } from "../../../styles/colors.stylex";
import { conditions } from "../../../styles/conditions.stylex";
export default function ProductDetailPending({
	modal = false,
}: {
	modal?: boolean;
}) {
	return (
		<div
			{...stylex.props(layoutStyles.screen, modal && layoutStyles.modalScreen)}
		>
			<div {...stylex.props(layoutStyles.container)}>
				{!modal && <div {...stylex.props(layoutStyles.backSkeleton)} />}
				<div {...stylex.props(layoutStyles.columns)}>
					<div {...stylex.props(layoutStyles.imageSkeleton)} />
					<div>
						<div {...stylex.props(layoutStyles.titleSkeleton)} />
						<div {...stylex.props(layoutStyles.descriptionSkeleton)} />
						<div {...stylex.props(layoutStyles.priceSkeleton)} />
					</div>
				</div>
			</div>
		</div>
	);
}
const pulse = stylex.keyframes({
	"50%": {
		opacity: 0.5,
	},
});
const layoutStyles = stylex.create({
	modalScreen: { minHeight: 0, padding: "32px", paddingTop: "52px" },
	screen: {
		minHeight: "100vh",
		backgroundColor: colors.background,
		paddingLeft: "1rem",
		paddingRight: "1rem",
		paddingBottom: "4rem",
		paddingTop: "40px",
	},
	container: {
		marginLeft: "auto",
		marginRight: "auto",
		width: "100%",
		maxWidth: "72rem",
	},
	backSkeleton: {
		height: "1.25rem",
		width: "8rem",
		animationName: {
			default: pulse,
			[conditions.reducedMotion]: "none",
		},
		animationDuration: "2s",
		animationTimingFunction: "cubic-bezier(.4, 0, .6, 1)",
		animationIterationCount: "infinite",
		borderRadius: "9999px",
		backgroundColor: colors.muted,
		transitionProperty: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
	columns: {
		marginTop: "1.5rem",
		display: "grid",
		gap: "2rem",
		gridTemplateColumns: {
			default: null,
			[conditions.detailColumns]: "minmax(0,1.2fr) minmax(0,0.8fr)",
		},
	},
	imageSkeleton: {
		aspectRatio: "1",
		width: "100%",
		animationName: {
			default: pulse,
			[conditions.reducedMotion]: "none",
		},
		animationDuration: "2s",
		animationTimingFunction: "cubic-bezier(.4, 0, .6, 1)",
		animationIterationCount: "infinite",
		borderRadius: "1rem",
		borderTopWidth: "1px",
		borderRightWidth: "1px",
		borderBottomWidth: "1px",
		borderLeftWidth: "1px",
		borderTopStyle: "solid",
		borderRightStyle: "solid",
		borderBottomStyle: "solid",
		borderLeftStyle: "solid",
		borderTopColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderRightColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderBottomColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		borderLeftColor: "color-mix(in oklab, var(--border) 60%, transparent)",
		backgroundColor: "color-mix(in oklab, var(--muted) 40%, transparent)",
		transitionProperty: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
	titleSkeleton: {
		height: "1.5rem",
		width: "66.6666666667%",
		animationName: {
			default: pulse,
			[conditions.reducedMotion]: "none",
		},
		animationDuration: "2s",
		animationTimingFunction: "cubic-bezier(.4, 0, .6, 1)",
		animationIterationCount: "infinite",
		borderRadius: "0.25rem",
		backgroundColor: colors.muted,
		marginBottom: {
			default: null,
			":not(:last-child)": "1rem",
		},
		transitionProperty: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
	descriptionSkeleton: {
		height: "5rem",
		width: "100%",
		animationName: {
			default: pulse,
			[conditions.reducedMotion]: "none",
		},
		animationDuration: "2s",
		animationTimingFunction: "cubic-bezier(.4, 0, .6, 1)",
		animationIterationCount: "infinite",
		borderRadius: "0.25rem",
		backgroundColor: colors.muted,
		marginBottom: {
			default: null,
			":not(:last-child)": "1rem",
		},
		transitionProperty: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
	priceSkeleton: {
		height: "2.5rem",
		width: "33.3333333333%",
		animationName: {
			default: pulse,
			[conditions.reducedMotion]: "none",
		},
		animationDuration: "2s",
		animationTimingFunction: "cubic-bezier(.4, 0, .6, 1)",
		animationIterationCount: "infinite",
		borderRadius: "0.25rem",
		backgroundColor: colors.muted,
		marginBottom: {
			default: null,
			":not(:last-child)": "1rem",
		},
		transitionProperty: {
			default: null,
			[conditions.reducedMotion]: "none",
		},
	},
});
