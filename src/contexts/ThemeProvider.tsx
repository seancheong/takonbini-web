import * as stylex from "@stylexjs/stylex";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";
import { FunctionOnce } from "@/lib/FunctionOnce";
import { darkTheme } from "../styles/themes.stylex";

export const themeCookieKey = "takonbini-ui-theme";
export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	defaultTheme?: Theme;
	cookieKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const compiledDarkThemeClass = stylex.props(darkTheme).className;
if (!compiledDarkThemeClass)
	throw new Error("StyleX dark theme did not compile");
const darkThemeClasses = compiledDarkThemeClass.split(/\s+/);

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	defaultTheme = "system",
	cookieKey = themeCookieKey,
	children,
}: PropsWithChildren<ThemeProviderProps>) {
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window !== "undefined") {
			const cookieMatch = document.cookie.match(
				new RegExp(`(?:^|; )${cookieKey}=([^;]*)`),
			);

			if (cookieMatch) {
				return decodeURIComponent(cookieMatch[1]) as Theme;
			}
		}

		return defaultTheme;
	});

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("light", "dark", ...darkThemeClasses);

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";

			root.classList.add(systemTheme);
			if (systemTheme === "dark") root.classList.add(...darkThemeClasses);
			return;
		}

		root.classList.add(theme);
		if (theme === "dark") root.classList.add(...darkThemeClasses);
	}, [theme]);

	const value = {
		theme,
		setTheme: (theme: Theme) => {
			// biome-ignore lint/suspicious/noDocumentCookie: Ignore this for theme persistence
			document.cookie = `${cookieKey}=${encodeURIComponent(theme)}; Path=/; Max-Age=31536000`;
			setTheme(theme);
		},
	};

	return (
		<ThemeProviderContext.Provider value={value}>
			<FunctionOnce param={{ storageKey: cookieKey, darkThemeClasses }}>
				{({
					storageKey,
					darkThemeClasses,
				}: {
					storageKey: string;
					darkThemeClasses: string[];
				}) => {
					const cookieMatch = document.cookie.match(
						new RegExp(`(?:^|; )${storageKey}=([^;]*)`),
					);
					const theme = cookieMatch
						? (decodeURIComponent(cookieMatch[1]) as Theme)
						: null;

					if (
						theme === "dark" ||
						((theme === null || theme === "system") &&
							window.matchMedia("(prefers-color-scheme: dark)").matches)
					) {
						document.documentElement.classList.add("dark", ...darkThemeClasses);
					}
				}}
			</FunctionOnce>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
