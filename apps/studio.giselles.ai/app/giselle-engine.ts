import { waitForLangfuseFlush } from "@/instrumentation.node";
import { fetchUsageLimits } from "@/packages/lib/fetch-usage-limits";
import { onConsumeAgentTime } from "@/packages/lib/on-consume-agent-time";
import supabaseStorageDriver from "@/supabase-storage-driver";
import { WorkspaceId } from "@giselle-sdk/data-type";
import { NextGiselleEngine } from "@giselle-sdk/giselle-engine/next";
import { supabaseVaultDriver } from "@giselle-sdk/supabase-driver";
import { createStorage } from "unstorage";

export const storage = createStorage({
	driver: supabaseStorageDriver({
		supabaseUrl: process.env.SUPABASE_URL ?? "",
		supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
		bucket: "app",
	}),
});

const vault = supabaseVaultDriver({
	url: process.env.SUPABASE_URL ?? "",
	serviceKey: process.env.SUPABASE_SERVICE_KEY ?? "",
});

const sampleAppWorkspaceId = WorkspaceId.parse(
	process.env.SAMPLE_APP_WORKSPACE_ID,
);

export const giselleEngine = NextGiselleEngine({
	basePath: "/api/giselle",
	storage,
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
		},
		// github: {
		// 	provider: "github",
		// 	auth: {
		// 		strategy: "app-installation",
		// 		appId: 1234,
		// 		privateKey: "pp",
		// 	},
		// },
	},
	vault,
});
