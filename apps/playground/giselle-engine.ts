import type {
	GiselleIntegrationConfig,
	LanguageModelProvider,
} from "giselle-sdk";
import { NextGiselleEngine } from "giselle-sdk/next";

import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import vercelBlobDriver from "unstorage/drivers/vercel-blob";

const isVercelEnvironment = process.env.VERCEL === "1";

const storage = createStorage({
	driver: isVercelEnvironment
		? vercelBlobDriver({
				access: "public",
				base: "private-beta",
			})
		: fsDriver({
				base: "./.storage",
			}),
});

const llmProviders: LanguageModelProvider[] = [];
if (process.env.OPENAI_API_KEY) {
	llmProviders.push("openai");
}
if (process.env.ANTHROPIC_API_KEY) {
	llmProviders.push("anthropic");
}
if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
	llmProviders.push("google");
}

if (llmProviders.length === 0) {
	throw new Error("No LLM providers configured");
}

const integrationConfigs: GiselleIntegrationConfig[] = [];
if (
	process.env.GITHUB_APP_ID &&
	process.env.GITHUB_APP_PRIVATE_KEY &&
	process.env.GITHUB_APP_CLIENT_ID &&
	process.env.GITHUB_APP_CLIENT_SECRET
) {
	integrationConfigs.push({
		provider: "github",
		auth: {
			strategy: "github-installation",
			appId: process.env.GITHUB_APP_ID,
			privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
		},
	});
}
if (process.env.GITHUB_TOKEN) {
	integrationConfigs.push({
		provider: "github",
		auth: {
			strategy: "github-token",
			token: process.env.GITHUB_TOKEN,
		},
	});
}

export const giselleEngine = NextGiselleEngine({
	basePath: "/api/giselle",
	storage,
	llmProviders,
	integrationConfigs,
});
