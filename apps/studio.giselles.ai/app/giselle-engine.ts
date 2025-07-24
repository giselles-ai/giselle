import { WorkspaceId } from "@giselle-sdk/data-type";
import { emitTelemetry } from "@giselle-sdk/giselle";
import { NextGiselleEngine } from "@giselle-sdk/giselle/next";
import {
	supabaseStorageDriver as experimental_supabaseStorageDriver,
	supabaseVaultDriver,
} from "@giselle-sdk/supabase-driver";
import { openaiVectorStore } from "@giselle-sdk/vector-store-adapters";
import { createStorage } from "unstorage";
import { waitForLangfuseFlush } from "@/instrumentation.node";
import { fetchUsageLimits } from "@/packages/lib/fetch-usage-limits";
import { onConsumeAgentTime } from "@/packages/lib/on-consume-agent-time";
import supabaseStorageDriver from "@/supabase-storage-driver";
import { gitHubQueryService, gitHubPullRequestQueryService } from "../lib/vector-stores/github";

export const publicStorage = createStorage({
	driver: supabaseStorageDriver({
		supabaseUrl: process.env.SUPABASE_URL ?? "",
		supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
		bucket: "public-assets",
	}),
});

const storage = createStorage({
	driver: supabaseStorageDriver({
		supabaseUrl: process.env.SUPABASE_URL ?? "",
		supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
		bucket: "app",
	}),
});

const experimental_storage = experimental_supabaseStorageDriver({
	endpoint: process.env.SUPABASE_STORAGE_URL ?? "",
	region: process.env.SUPABASE_STORAGE_REGION ?? "",
	accessKeyId: process.env.SUPABASE_STORAGE_ACCESS_KEY_ID ?? "",
	secretAccessKey: process.env.SUPABASE_STORAGE_SECRET_ACCESS_KEY ?? "",
	bucket: "app",
});

const vault = supabaseVaultDriver({
	url: process.env.SUPABASE_URL ?? "",
	serviceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
});

const sampleAppWorkspaceId = WorkspaceId.parse(
	process.env.SAMPLE_APP_WORKSPACE_ID,
);

const githubAppId = process.env.GITHUB_APP_ID;
const githubAppPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;
const githubAppClientId = process.env.GITHUB_APP_CLIENT_ID;
const githubAppClientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
const githubAppWebhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

if (
	githubAppId === undefined ||
	githubAppPrivateKey === undefined ||
	githubAppClientId === undefined ||
	githubAppClientSecret === undefined ||
	githubAppWebhookSecret === undefined
) {
	throw new Error("missing github credentials");
}

export const giselleEngine = NextGiselleEngine({
	basePath: "/api/giselle",
	storage,
	experimental_storage,
	llmProviders: ["openai", "anthropic", "google", "perplexity", "fal"],
	onConsumeAgentTime,
	telemetry: {
		isEnabled: true,
		waitForFlushFn: waitForLangfuseFlush,
	},
	fetchUsageLimitsFn: fetchUsageLimits,
	sampleAppWorkspaceId,
	integrationConfigs: {
		github: {
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
		},
	},
	vault,
	vectorStoreQueryServices: {
		github: gitHubQueryService,
		githubPullRequest: gitHubPullRequestQueryService,
	},
	callbacks: {
		generationComplete: async (generation, options) => {
			try {
				await emitTelemetry(generation, {
					telemetry: options.telemetry,
					storage,
				});
			} catch (error) {
				console.error("Telemetry emission failed:", error);
			}
		},
	},
	vectorStore: openaiVectorStore(process.env.OPENAI_API_KEY ?? ""),
});
