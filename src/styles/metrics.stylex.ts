import * as stylex from "@stylexjs/stylex";

export const metrics = stylex.defineVars({
	headerHeight: {
		default: "88px",
		"@media (max-width: 600px)": "76px",
		"@media (max-height: 500px)": "56px",
	},
	radius: "0.625rem",
	controlTarget: "2.75rem",
	controlText: "0.875rem",
	controlLine: "1.25rem",
	transitionFast: "150ms",
	actionRadius: "0.35rem",
	cardRadius: "0.4rem",
});
