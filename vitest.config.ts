import { fileURLToPath } from "node:url";
import stylex from "@stylexjs/unplugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// The Rollup adapter compiles styles without Vite dev-server polling.
	plugins: [stylex.rollup({ runtimeInjection: false })],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
	},
});
