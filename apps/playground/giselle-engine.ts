import { WorkspaceId } from "@giselle-sdk/data-type";
import type {
	GiselleIntegrationConfig,
	LanguageModelProvider,
} from "@giselle-sdk/giselle";
import { fsStorageDriver } from "@giselle-sdk/giselle";
import { NextGiselleEngine } from "@giselle-sdk/giselle/next-internal";
import { traceGeneration } from "@giselle-sdk/langfuse";
import { supabaseStorageDriver as experimental_supabaseStorageDriver } from "@giselle-sdk/supabase-driver";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { nodeVaultDriver } from "./lib/vault-driver";
import supabaseStorageDriver from "./supabase-storage-driver";

const isVercelEnvironment = process.env.VERCEL === "1";

const storage = createStorage({
	driver: isVercelEnvironment
		? supabaseStorageDriver({
				supabaseUrl: process.env.SUPABASE_URL ?? "",
				supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
				bucket: "app",
			})
		: fsDriver({
				base: "./.storage",
			}),
});

const experimental_storage = isVercelEnvironment
	? experimental_supabaseStorageDriver({
			endpoint: process.env.SUPABASE_STORAGE_URL ?? "",
			region: process.env.SUPABASE_STORAGE_REGION ?? "",
			accessKeyId: process.env.SUPABASE_STORAGE_ACCESS_KEY_ID ?? "",
			secretAccessKey: process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY ?? "",
			bucket: "app",
		})
	: fsStorageDriver({
			root: "./.storage",
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

if (process.env.VAULT_SECRET === undefined) {
	throw new Error("VAULT_SECRET is not defined");
}

const integrationConfigs: GiselleIntegrationConfig = {};

const githubAppId = process.env.GITHUB_APP_ID;
const githubAppPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;
const githubAppClientId = process.env.GITHUB_APP_CLIENT_ID;
const githubAppClientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
const githubAppWebhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

if (
	githubAppId !== undefined &&
	githubAppPrivateKey !== undefined &&
	githubAppClientId !== undefined &&
	githubAppClientSecret !== undefined &&
	githubAppWebhookSecret !== undefined
) {
	integrationConfigs.github = {
		auth: {
			strategy: "app-installation",
			appId: "",
			privateKey: "",
			resolver: {
				installationIdForRepo: () => 1234,
				installtionIds: () => [1234],
			},
		},
		authV2: {
			appId: githubAppId,
			privateKey: githubAppPrivateKey,
			clientId: githubAppClientId,
			clientSecret: githubAppClientSecret,
			webhookSecret: githubAppWebhookSecret,
		},
	};
}
// if (
// 	process.env.GITHUB_APP_ID &&
// 	process.env.GITHUB_APP_PRIVATE_KEY &&
// 	process.env.GITHUB_APP_CLIENT_ID &&
// 	process.env.GITHUB_APP_CLIENT_SECRET
// ) {
// 	integrationConfigs.push({
// 		provider: "github",
// 		auth: {
// 			strategy: "github-installation",
// 			appId: process.env.GITHUB_APP_ID,
// 			privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
// 		},
// 	});
// }
// if (process.env.GITHUB_TOKEN) {
// 	integrationConfigs = {
// 		github: {
// 			auth: {
// 				strategy: "personal-access-token",
// 				personalAccessToken: process.env.GITHUB_TOKEN,
// 			},
// 		},
// 	};
// }

if (process.env.PERPLEXITY_API_KEY) {
	llmProviders.push("perplexity");
}

if (process.env.FAL_API_KEY) {
	llmProviders.push("fal");
}

let sampleAppWorkspaceId: WorkspaceId | undefined;
if (process.env.SAMPLE_APP_WORKSPACE_ID) {
	const parseResult = WorkspaceId.safeParse(
		process.env.SAMPLE_APP_WORKSPACE_ID,
	);
	if (parseResult.success) {
		sampleAppWorkspaceId = parseResult.data;
	}
}

export const giselleEngine = NextGiselleEngine({
	basePath: "/api/giselle",
	storage,
	experimental_storage,
	llmProviders,
	integrationConfigs,
	sampleAppWorkspaceId,
	callbacks: {
		generationComplete: async (args) => {
			try {
				await traceGeneration(args);
			} catch (error) {
				console.error("Trace generation failed:", error);
			}
		},
	},
	vault: nodeVaultDriver({
		secret: process.env.VAULT_SECRET,
	}),
});
