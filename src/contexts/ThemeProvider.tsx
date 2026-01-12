import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from "react";
import { FunctionOnce } from "@/lib/FunctionOnce";

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

		root.classList.remove("light", "dark");

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";

			root.classList.add(systemTheme);
			return;
		}

		root.classList.add(theme);
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
			<FunctionOnce param={cookieKey}>
				{(storageKey: string) => {
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
						document.documentElement.classList.add("dark");
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
