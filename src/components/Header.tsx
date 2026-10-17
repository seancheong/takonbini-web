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
							src="/icon-green.svg"
							alt=""
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
		position: "relative",
		width: "100%",
		borderBottom: "1px solid",
		borderColor: colors.border,
		backgroundColor: colors.background,
		paddingInline: { default: "40px", [conditions.compactCatalog]: "20px" },
	},
	inner: {
		marginInline: "auto",
		display: "flex",
		height: { default: "88px", [conditions.compactCatalog]: "76px" },
		maxWidth: "1200px",
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
		display: "block",
		width: "36px",
		height: "36px",
		flexShrink: 0,
		marginInlineEnd: "12px",
	},
	name: {
		fontWeight: 700,
		fontSize: { default: "18px", [conditions.compactCatalog]: "15px" },
		textTransform: "uppercase",
		whiteSpace: "nowrap",
		letterSpacing: "-.5px",
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
