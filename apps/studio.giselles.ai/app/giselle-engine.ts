import { waitForLangfuseFlush } from "@/instrumentation.node";
import { fetchUsageLimits } from "@/packages/lib/fetch-usage-limits";
import { onConsumeAgentTime } from "@/packages/lib/on-consume-agent-time";
import { WorkspaceId } from "@giselle-sdk/data-type";
import { NextGiselleEngine } from "@giselle-sdk/giselle-engine/next-internal";
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
});
