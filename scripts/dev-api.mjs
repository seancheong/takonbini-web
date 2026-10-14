import { spawn } from "node:child_process";
import { Resolver } from "node:dns/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const apiDirectory = process.env.TAKONBINI_API_DIR
	? resolve(process.env.TAKONBINI_API_DIR)
	: resolve(webRoot, "../takonbini-api/services/api");
const apiRequire = createRequire(resolve(apiDirectory, "package.json"));

async function start() {
	apiRequire("dotenv").config({
		path: resolve(apiDirectory, ".env.local"),
		quiet: true,
	});
	const parameterName = process.env.MONGODB_PARAMETER_NAME;
	if (!parameterName)
		throw new Error("Set MONGODB_PARAMETER_NAME in the API's .env.local.");

	const { SSMClient, GetParameterCommand } = apiRequire("@aws-sdk/client-ssm");
	const ssm = new SSMClient({});
	let value;
	try {
		const result = await ssm.send(
			new GetParameterCommand({ Name: parameterName, WithDecryption: true }),
			{ abortSignal: AbortSignal.timeout(15000) },
		);
		value = result.Parameter?.Value;
	} finally {
		ssm.destroy();
	}
	if (!value) throw new Error("The MongoDB SSM parameter is empty.");

	const uri = new URL(value);
	if (uri.protocol !== "mongodb+srv:")
		throw new Error(
			"This local launcher expects an Atlas mongodb+srv connection string.",
		);
	const resolver = new Resolver({ timeout: 3000, tries: 1 });
	const servers = await resolver.resolveSrv(`_mongodb._tcp.${uri.hostname}`);
	if (!servers.length)
		throw new Error("MongoDB server discovery returned no servers.");

	// Atlas authenticates against admin; a standard URI also needs explicit TLS.
	uri.searchParams.set("authSource", "admin");
	uri.searchParams.set("tls", "true");
	const hosts = servers
		.map((server) => `${server.name}:${server.port}`)
		.join(",");
	const standardUri = `mongodb://${uri.username}:${uri.password}@${hosts}${uri.pathname}?${uri.searchParams}`;
	console.log(
		"Starting local API with SSM credentials and a standard TLS connection (no DNS TXT lookup).",
	);
	const child = spawn(
		process.execPath,
		["-r", apiRequire.resolve("ts-node/register"), "src/index.ts"],
		{
			cwd: apiDirectory,
			stdio: "inherit",
			env: {
				...process.env,
				MONGODB_PARAMETER_NAME: "",
				MONGODB_URI: standardUri,
			},
		},
	);
	for (const signal of ["SIGINT", "SIGTERM"])
		process.on(signal, () => child.kill(signal));
	child.on("error", (error) => {
		console.error("Could not start the API:", error.code);
		process.exitCode = 1;
	});
	child.on("exit", (code) => {
		process.exitCode = code ?? 1;
	});
}

start().catch((error) => {
	// SDK errors can include private infrastructure details; report only the type.
	console.error("Local API startup failed:", error.name);
	console.error(
		"Check the API's SSM configuration, AWS login, and sibling API dependencies.",
	);
	process.exitCode = 1;
});
