import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [origin, outputDirectory] = process.argv.slice(2);
const runtime = process.env.LIGHTHOUSE_RUNTIME_ROOT;
if (!origin || !outputDirectory || !runtime || !process.env.CHROME_PATH) {
	throw new Error(
		"Usage: LIGHTHOUSE_RUNTIME_ROOT=... CHROME_PATH=... node scripts/measure-mobile.mjs ORIGIN OUTPUT_DIRECTORY",
	);
}
const requireRuntime = createRequire(resolve(runtime, "package.json"));
const { default: lighthouse } = await import(
	pathToFileURL(requireRuntime.resolve("lighthouse"))
);
const { launch } = await import(
	pathToFileURL(requireRuntime.resolve("chrome-launcher"))
);
const versions = {};
for (const name of ["lighthouse", "chrome-launcher"]) {
	versions[name] = JSON.parse(
		await readFile(requireRuntime.resolve(`${name}/package.json`), "utf8"),
	).version;
}
if (
	versions.lighthouse !== "13.4.1" ||
	versions["chrome-launcher"] !== "1.2.2"
) {
	throw new Error(
		"This measurement method pins Lighthouse 13.4.1 and chrome-launcher 1.2.2.",
	);
}
const directory = resolve(outputDirectory);
await mkdir(directory, { recursive: true });
const cases = [
	{ name: "catalog", path: "/?lang=en", imageNeedle: "044859" },
	{
		name: "heavy-detail",
		path: "/products/01e1c84bc70c04a2c7eb082ee879d20c?lang=en",
		imageNeedle: "044859",
	},
	{
		name: "light-detail",
		path: "/products/0d41fc1137e1762b66b05d4539990c2b?lang=en",
		imageNeedle: "4757122",
	},
];
const samples = [];
const configuration = {
	method:
		"Maintainer-agreed applied throttling, Chrome default features; original simulated failures remain historical evidence.",
	origin,
	versions,
	settings: undefined,
	spawnArguments: undefined,
	userAgent: undefined,
	samples,
};
for (let run = 1; run <= 3; run++) {
	for (const scenario of cases) {
		const chrome = await launch({
			chromePath: process.env.CHROME_PATH,
			ignoreDefaultFlags: true,
			chromeFlags: ["--headless", "--disable-gpu", "--no-first-run"],
		});
		try {
			const spawnArguments = chrome.process.spawnargs.map((argument) =>
				argument.startsWith("--user-data-dir=")
					? "--user-data-dir=<TEMP_PROFILE>"
					: argument.startsWith("--remote-debugging-port=")
						? "--remote-debugging-port=<PORT>"
						: argument,
			);
			if (
				spawnArguments.some(
					(argument) =>
						argument.startsWith("--disable-features=") ||
						argument.startsWith("--enable-features="),
				)
			) {
				throw new Error("Unexpected Chrome feature override.");
			}
			const result = await lighthouse(new URL(scenario.path, origin).href, {
				port: chrome.port,
				logLevel: "error",
				onlyCategories: ["performance"],
				throttlingMethod: "devtools",
				throttling: {
					rttMs: 150,
					throughputKbps: 1638.4,
					requestLatencyMs: 150,
					downloadThroughputKbps: 1638.4,
					uploadThroughputKbps: 750,
					cpuSlowdownMultiplier: 4,
				},
				additionalTraceCategories: "cc,viz",
				output: "json",
			});
			const prefix = `${directory}/${scenario.name}-${run}`;
			await writeFile(`${prefix}.report.json`, JSON.stringify(result.lhr));
			await writeFile(
				`${prefix}.trace.json`,
				JSON.stringify(result.artifacts.Trace),
			);
			await writeFile(
				`${prefix}.devtoolslog.json`,
				JSON.stringify(result.artifacts.DevtoolsLog),
			);
			if (result.lhr.runtimeError)
				throw new Error(JSON.stringify(result.lhr.runtimeError));
			const audit = result.lhr.audits;
			configuration.settings ??= result.lhr.configSettings;
			configuration.spawnArguments ??= spawnArguments;
			configuration.userAgent ??= result.lhr.environment.hostUserAgent;
			const images = result.artifacts.DevtoolsLog.filter(
				(event) => event.method === "Network.responseReceived",
			)
				.map((event) => event.params.response)
				.filter(
					(response) =>
						response.url.includes("/api/image?") &&
						response.url.includes(scenario.imageNeedle),
				)
				.map((response) => ({
					url: response.url,
					status: response.status,
					cache: response.headers["x-vercel-cache"],
					diskCache: response.fromDiskCache ?? false,
				}));
			const sample = {
				case: scenario.name,
				run,
				score: Math.round(result.lhr.categories.performance.score * 100),
				LCP_ms: audit["largest-contentful-paint"].numericValue,
				TBT_ms: audit["total-blocking-time"].numericValue,
				CLS: audit["cumulative-layout-shift"].numericValue,
				transfer_bytes: audit["total-byte-weight"].numericValue,
				images,
			};
			samples.push(sample);
			await writeFile(
				`${directory}/summary.json`,
				JSON.stringify(configuration, null, 2),
			);
			console.log(JSON.stringify(sample));
		} finally {
			await chrome.kill();
		}
	}
}
if (
	samples.some(
		(sample) => sample.score < 90 || sample.LCP_ms > 2500 || sample.CLS > 0.1,
	)
) {
	process.exitCode = 1;
}
