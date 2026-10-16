import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { colors } from "../styles/colors.stylex";
import { conditions } from "../styles/conditions.stylex";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";
export default function Header() {
	const { t } = useTranslation();
	return (
		<header {...stylex.props(layoutStyles.header)}>
			<div {...stylex.props(layoutStyles.inner)}>
				<div {...stylex.props(layoutStyles.brand)}>
					<Link to="/" {...stylex.props(layoutStyles.home)}>
						<img
							src="/icon.svg"
							alt="Takonbini Logo"
							{...stylex.props(layoutStyles.logo)}
						/>
						<span {...stylex.props(layoutStyles.name)}>{t("appName")}</span>
					</Link>
				</div>

				<div {...stylex.props(layoutStyles.controls)}>
					<ThemeSelect />
					<LanguageSelect />
				</div>
			</div>
		</header>
	);
}
const layoutStyles = stylex.create({
	header: {
		viewTransitionName: "app-header",
		transform: "translateZ(0)",
		willChange: "transform",
		position: "fixed",
		top: "0px",
		zIndex: 50,
		width: "100%",
		borderBottomWidth: "1px",
		borderBottomStyle: "solid",
		borderTopColor: colors.border,
		borderRightColor: colors.border,
		borderBottomColor: colors.border,
		borderLeftColor: colors.border,
		backgroundColor: colors.background,
		paddingLeft: "1rem",
		paddingRight: "1rem",
	},
	inner: {
		marginLeft: "auto",
		marginRight: "auto",
		display: "flex",
		height: "4rem",
		width: "100%",
		maxWidth: "72rem",
		alignItems: "center",
		justifyContent: "space-between",
	},
	brand: {
		display: "flex",
		minWidth: "0px",
	},
	home: {
		marginRight: {
			default: "0.75rem",
			[conditions.shellLabels]: "1.5rem",
		},
		display: "flex",
		minWidth: "0px",
		alignItems: "center",
	},
	logo: {
		display: {
			default: "none",
			[conditions.shellLabels]: "block",
		},
		height: "1.5rem",
		width: "1.5rem",
		marginInlineEnd: {
			default: null,
			":not(:last-child)": "0.5rem",
		},
	},
	name: {
		whiteSpace: "nowrap",
		fontWeight: 700,
		fontSize: {
			default: "0.875rem",
			[conditions.shellLabels]: "1rem",
		},
		lineHeight: {
			default: "1.25rem",
			[conditions.shellLabels]: "1.5rem",
		},
		display: {
			default: null,
			[conditions.shellLabels]: "inline-block",
		},
		marginInlineEnd: {
			default: null,
			":not(:last-child)": "0.5rem",
		},
	},
	controls: {
		display: "flex",
		flexShrink: 0,
		alignItems: "center",
		gap: {
			default: "0.25rem",
			[conditions.shellLabels]: "0.5rem",
		},
	},
});
