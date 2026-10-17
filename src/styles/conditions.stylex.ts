import * as stylex from "@stylexjs/stylex";

export const conditions = stylex.defineConsts({
	indexTablet: "@media (min-width: 521px)",
	indexDesktop: "@media (min-width: 801px)",
	compactCatalog: "@media (max-width: 600px)",
	tabletGrid: "@media (min-width: 800px)",
	desktopGrid: "@media (min-width: 1100px)",
	shellLabels: "@media (min-width: 640px)",
	detailColumns: "@media (min-width: 1024px)",
	reducedMotion: "@media (prefers-reduced-motion: reduce)",
});
