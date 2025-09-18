import { WorkspaceId } from "@giselle-sdk/data-type";
import type {
	CompletedGeneration,
	FailedGeneration,
	OutputFileBlob,
	QueryContext,
	RunningGeneration,
} from "@giselle-sdk/giselle";
import {
	getRequestId,
	NextGiselleEngine,
} from "@giselle-sdk/giselle/next-internal";
import { traceEmbedding, traceGeneration } from "@giselle-sdk/langfuse";
import type { EmbeddingMetrics } from "@giselle-sdk/rag";
import {
	supabaseStorageDriver as experimental_supabaseStorageDriver,
	supabaseVaultDriver,
} from "@giselle-sdk/supabase-driver";
import { openaiVectorStore } from "@giselle-sdk/vector-store-adapters";
import type { ModelMessage, ProviderMetadata } from "ai";
import { after } from "next/server";
import { createStorage } from "unstorage";
import { waitForLangfuseFlush } from "@/instrumentation.node";
import { logger } from "@/lib/logger";
import { getWorkspaceTeam } from "@/lib/workspaces/get-workspace-team";
import { fetchUsageLimits } from "@/packages/lib/fetch-usage-limits";
import { onConsumeAgentTime } from "@/packages/lib/on-consume-agent-time";
import { fetchCurrentUser } from "@/services/accounts";
import {
	type CurrentTeam,
	fetchCurrentTeam,
	isProPlan,
} from "@/services/teams";
import supabaseStorageDriver from "@/supabase-storage-driver";
import {
	gitHubPullRequestQueryService,
	gitHubQueryService,
} from "../lib/vector-stores/github";

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

let sampleAppWorkspaceIds: WorkspaceId[] | undefined;
if (process.env.SAMPLE_APP_WORKSPACE_IDS) {
	const workspaceIdStrings = process.env.SAMPLE_APP_WORKSPACE_IDS.split(",")
		.map((id) => id.trim())
		.filter((id) => id.length > 0);
	const parsedWorkspaceIds: WorkspaceId[] = [];
	for (const workspaceIdString of workspaceIdStrings) {
		const parseResult = WorkspaceId.safeParse(workspaceIdString);
		if (parseResult.success) {
			parsedWorkspaceIds.push(parseResult.data);
		}
	}
	if (parsedWorkspaceIds.length > 0) {
		sampleAppWorkspaceIds = parsedWorkspaceIds;
	}
}

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

type TeamForPlan = Pick<CurrentTeam, "id" | "activeSubscriptionId" | "type">;

async function traceGenerationForTeam(args: {
	generation: CompletedGeneration | FailedGeneration;
	inputMessages: ModelMessage[];
	outputFileBlobs?: OutputFileBlob[];
	sessionId?: string;
	userId: string;
	team: TeamForPlan;
	providerMetadata?: ProviderMetadata;
	requestId?: string;
}) {
	const isPro = isProPlan(args.team);
	const planTag = isPro ? "plan:pro" : "plan:free";
	const teamTypeTag = `teamType:${args.team.type}`;

	await traceGeneration({
		generation: args.generation,
		outputFileBlobs: args.outputFileBlobs,
		inputMessages: args.inputMessages,
		userId: args.userId,
		tags: [planTag, teamTypeTag],
		metadata: {
			generationId: args.generation.id,
			isProPlan: isPro,
			teamType: args.team.type,
			userId: args.userId,
			subscriptionId: args.team.activeSubscriptionId ?? "",
			providerMetadata: args.providerMetadata,
			requestId: args.requestId,
		},
		sessionId: args.sessionId,
	});
}

async function traceEmbeddingForTeam(args: {
	metrics: EmbeddingMetrics;
	generation: RunningGeneration;
	queryContext: QueryContext;
	sessionId?: string;
	userId: string;
	team: TeamForPlan;
}) {
	const isPro = isProPlan(args.team);
	const planTag = isPro ? "plan:pro" : "plan:free";
	const teamTypeTag = `teamType:${args.team.type}`;

	if (args.queryContext.provider !== "github") {
		throw new Error(`Unsupported provider: ${args.queryContext.provider}`);
	}

	await traceEmbedding({
		metrics: args.metrics,
		userId: args.userId,
		sessionId: args.sessionId,
		tags: [planTag, teamTypeTag, "embedding-purpose:query"],
		metadata: {
			generationId: args.generation.id,
			teamId: args.team.id,
			isProPlan: isPro,
			teamType: args.team.type,
			userId: args.userId,
			subscriptionId: args.team.activeSubscriptionId ?? "",
			resourceProvider: args.queryContext.provider,
			resourceContentType: args.queryContext.contentType,
			resourceOwner: args.queryContext.owner,
			resourceRepo: args.queryContext.repo,
		},
	});
}

type GenerationTraceArgs = {
	generation: CompletedGeneration | FailedGeneration;
	inputMessages: ModelMessage[];
	outputFileBlobs?: OutputFileBlob[];
	providerMetadata?: ProviderMetadata;
	requestId?: string;
};

function handleGenerationTrace(args: GenerationTraceArgs) {
	after(async () => {
		try {
			switch (args.generation.context.origin.type) {
				case "github-app": {
					const team = await getWorkspaceTeam(
						args.generation.context.origin.workspaceId,
					);
					await traceGenerationForTeam({
						generation: args.generation,
						inputMessages: args.inputMessages,
						outputFileBlobs: args.outputFileBlobs,
						sessionId: args.generation.context.origin.actId,
						userId: "github-app",
						team,
						providerMetadata: args.providerMetadata,
						requestId: args.requestId,
					});
					break;
				}
				case "stage":
				case "studio": {
					const [currentUser, currentTeam] = await Promise.all([
						fetchCurrentUser(),
						fetchCurrentTeam(),
					]);
					await traceGenerationForTeam({
						generation: args.generation,
						inputMessages: args.inputMessages,
						outputFileBlobs: args.outputFileBlobs,
						sessionId: args.generation.context.origin.actId,
						userId: currentUser.id,
						team: currentTeam,
						providerMetadata: args.providerMetadata,
						requestId: args.requestId,
					});
					break;
				}
				default: {
					const _exhaustiveCheck: never = args.generation.context.origin;
					throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
				}
			}
		} catch (error) {
			console.error("Trace generation failed:", error);
		}
	});
}

export const giselleEngine = NextGiselleEngine({
	basePath: "/api/giselle",
	storage,
	experimental_storage,
	llmProviders: ["openai", "anthropic", "google", "fal"],
	onConsumeAgentTime,
	telemetry: {
		isEnabled: true,
		waitForFlushFn: waitForLangfuseFlush,
	},
	fetchUsageLimitsFn: fetchUsageLimits,
	sampleAppWorkspaceIds,
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
		generationComplete: (args) => {
			const requestId = getRequestId();
			handleGenerationTrace({ ...args, requestId });
		},
		generationFailed: (args) => {
			const requestId = getRequestId();
			handleGenerationTrace({ ...args, requestId });
		},
		embeddingComplete: (args) => {
			after(async () => {
				try {
					switch (args.generation.context.origin.type) {
						case "github-app": {
							const team = await getWorkspaceTeam(
								args.generation.context.origin.workspaceId,
							);
							await traceEmbeddingForTeam({
								metrics: args.embeddingMetrics,
								generation: args.generation,
								queryContext: args.queryContext,
								sessionId: args.generation.context.origin.actId,
								userId: "github-app",
								team,
							});
							break;
						}
						case "stage":
						case "studio": {
							const [currentUser, currentTeam] = await Promise.all([
								fetchCurrentUser(),
								fetchCurrentTeam(),
							]);
							await traceEmbeddingForTeam({
								metrics: args.embeddingMetrics,
								generation: args.generation,
								queryContext: args.queryContext,
								sessionId: args.generation.context.origin.actId,
								userId: currentUser.id,
								team: currentTeam,
							});
							break;
						}
						default: {
							const _exhaustiveCheck: never = args.generation.context.origin;
							throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
						}
					}
				} catch (error) {
					console.error("Embedding callback failed:", error);
				}
			});
		},
	},
	vectorStore: openaiVectorStore(process.env.OPENAI_API_KEY ?? ""),
	aiGateway: {
		httpReferer:
			process.env.VERCEL_ENV === "preview"
				? `https://${process.env.VERCEL_URL}`
				: "https://studio.giselles.ai",
		xTitle:
			process.env.VERCEL_ENV === "preview" ? "Giselle(preview)" : "Giselle",
	},
	logger,
	waitUntil: after,
});
