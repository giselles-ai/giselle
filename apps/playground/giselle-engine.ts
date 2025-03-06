import type { LanguageModelProvider } from "giselle-sdk";
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

export const giselleEngine = NextGiselleEngine({
	basePath: "/api/giselle",
	storage,
	llmProviders,
});
