import type { KnipConfig } from "knip";

import playgroundAppConfig from "./apps/playground/next.config";
import { serverExternalPackages } from "./apps/studio.giselles.ai/next.config";

/**
 * @link https://github.com/vercel/next.js/blob/canary/packages/next/src/lib/server-external-packages.json
 * @link https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
 **/
const nextPredefinedExternalPackages = [
	"@appsignal/nodejs",
	"@aws-sdk/client-s3",
	"@aws-sdk/s3-presigned-post",
	"@blockfrost/blockfrost-js",
	"@highlight-run/node",
	"@huggingface/transformers",
	"@jpg-store/lucid-cardano",
	"@libsql/client",
	"@mikro-orm/core",
	"@mikro-orm/knex",
	"@node-rs/argon2",
	"@node-rs/bcrypt",
	"@prisma/client",
	"@react-pdf/renderer",
	"@sentry/profiling-node",
	"@sparticuz/chromium",
	"@sparticuz/chromium-min",
	"@swc/core",
	"@xenova/transformers",
	"argon2",
	"autoprefixer",
	"aws-crt",
	"bcrypt",
	"better-sqlite3",
	"canvas",
	"chromadb-default-embed",
	"config",
	"cpu-features",
	"cypress",
	"dd-trace",
	"eslint",
	"express",
	"firebase-admin",
	"htmlrewriter",
	"import-in-the-middle",
	"isolated-vm",
	"jest",
	"jsdom",
	"keyv",
	"libsql",
	"mdx-bundler",
	"mongodb",
	"mongoose",
	"newrelic",
	"next-mdx-remote",
	"next-seo",
	"node-cron",
	"node-pty",
	"node-web-audio-api",
	"onnxruntime-node",
	"oslo",
	"pg",
	"playwright",
	"playwright-core",
	"postcss",
	"prettier",
	"prisma",
	"puppeteer",
	"puppeteer-core",
	"ravendb",
	"require-in-the-middle",
	"rimraf",
	"sharp",
	"shiki",
	"sqlite3",
	"ts-node",
	"ts-morph",
	"typescript",
	"vscode-oniguruma",
	"webpack",
	"websocket",
	"zeromq",
];

const config: KnipConfig = {
	biome: false,
	workspaces: {
		"apps/playground": {
			ignoreDependencies: [
				...(playgroundAppConfig.serverExternalPackages ?? []),
				...nextPredefinedExternalPackages,
				"tailwindcss",
			],
		},
		"apps/studio.giselles.ai": {
			entry: ["tests/e2e/global-setup.ts"],
			ignore: ["scripts/**", "trigger.config.ts"],
			ignoreDependencies: [
				...serverExternalPackages,
				...nextPredefinedExternalPackages,
			],
		},
		"internal-packages/ui": {
			ignoreDependencies: ["tailwindcss"],
		},
		"internal-packages/workflow-designer-ui": {
			ignoreDependencies: ["tailwindcss"],
		},
		"packages/rag": {
			ignore: ["src/chunker/__fixtures__/code-sample.ts"],
		},
	},
	ignore: ["turbo/generators/config.ts", ".github/**"],
	ignoreBinaries: ["vercel"],
};

export default config;
