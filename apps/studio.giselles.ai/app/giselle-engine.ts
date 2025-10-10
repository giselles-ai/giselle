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
import { tasks as jobs } from "@trigger.dev/sdk";
import type { ModelMessage, ProviderMetadata } from "ai";
import { createStorage } from "unstorage";
import { waitForLangfuseFlush } from "@/instrumentation.node";
import { GenerationMetadata } from "@/lib/generation-metadata";
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
import type { runActJob } from "@/trigger/run-act-job";
import { getDocumentVectorStoreQueryService } from "../lib/vector-stores/document/query/service";
import {
	gitHubPullRequestQueryService,
	gitHubQueryService,
} from "../lib/vector-stores/github";
import type { generateContentJob } from "../trigger/generate-content-job";

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

	const { queryContext } = args;
	const baseMetadata = {
		generationId: args.generation.id,
		teamId: args.team.id,
		isProPlan: isPro,
		teamType: args.team.type,
		userId: args.userId,
		subscriptionId: args.team.activeSubscriptionId ?? "",
		resourceProvider: queryContext.provider,
		workspaceId: queryContext.workspaceId,
		embeddingProfileId: queryContext.embeddingProfileId,
	};

	const traceArgs = {
		metrics: args.metrics,
		userId: args.userId,
		sessionId: args.sessionId,
		tags: [planTag, teamTypeTag, "embedding-purpose:query"],
	};

	switch (queryContext.provider) {
		case "github": {
			await traceEmbedding({
				...traceArgs,
				metadata: {
					...baseMetadata,
					resourceContentType: queryContext.contentType,
					resourceOwner: queryContext.owner,
					resourceRepo: queryContext.repo,
				},
			});
			break;
		}
		case "document": {
			await traceEmbedding({
				...traceArgs,
				metadata: {
					...baseMetadata,
					documentVectorStoreId: queryContext.documentVectorStoreId,
				},
			});
			break;
		}
		default: {
			const _exhaustiveCheck: never = queryContext;
			throw new Error(`Unsupported provider: ${_exhaustiveCheck}`);
		}
	}
}

function getRuntimeEnv(): "trigger.dev" | "vercel" | "local" | "unknown" {
	if (process.env.TRIGGERDOTDEV === "1") return "trigger.dev";
	if (process.env.VERCEL === "1") return "vercel";
	if (process.env.NODE_ENV === "development") return "local";
	return "unknown";
}

const runtimeEnv = getRuntimeEnv();

const generateContentProcessor =
	process.env.USE_TRIGGER_DEV === "1" ||
	runtimeEnv === "trigger.dev" ||
	(runtimeEnv === "vercel" && process.env.NODE_ENV !== "development")
		? "trigger.dev"
		: "self";

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
		document: getDocumentVectorStoreQueryService(),
	},
	callbacks: {
		generationComplete: async (args) => {
			if (runtimeEnv === "trigger.dev") {
				const parsedMetadata = GenerationMetadata.parse(
					args.generationMetadata,
				);
				await traceGenerationForTeam({
					...args,
					requestId: parsedMetadata.requestId,
					userId: parsedMetadata.userId,
					sessionId: args.generation.context.origin.actId,
					team: {
						id: parsedMetadata.team.id,
						type: parsedMetadata.team.type,
						activeSubscriptionId: parsedMetadata.team.subscriptionId,
					},
				});
				return;
			}
			const requestId = getRequestId();
			if (args.generation.context.origin.type === "github-app") {
				const team = await getWorkspaceTeam(
					args.generation.context.origin.workspaceId,
				);
				await traceGenerationForTeam({
					...args,
					requestId,
					userId: "github-app",
					team,
				});
				return;
			}
			const [currentUser, currentTeam] = await Promise.all([
				fetchCurrentUser(),
				fetchCurrentTeam(),
			]);
			await traceGenerationForTeam({
				...args,
				requestId,
				userId: currentUser.id,
				team: currentTeam,
			});
		},
		generationFailed: async (args) => {
			if (runtimeEnv === "trigger.dev") {
				const parsedMetadata = GenerationMetadata.parse(
					args.generationMetadata,
				);
				await traceGenerationForTeam({
					...args,
					requestId: parsedMetadata.requestId,
					userId: parsedMetadata.userId,
					sessionId: args.generation.context.origin.actId,
					team: {
						id: parsedMetadata.team.id,
						type: parsedMetadata.team.type,
						activeSubscriptionId: parsedMetadata.team.subscriptionId,
					},
				});
				return;
			}
			const requestId = getRequestId();
			const [currentUser, currentTeam] = await Promise.all([
				fetchCurrentUser(),
				fetchCurrentTeam(),
			]);
			await traceGenerationForTeam({
				...args,
				requestId,
				userId: currentUser.id,
				team: currentTeam,
			});
		},
		embeddingComplete: async (args) => {
			try {
				if (runtimeEnv === "trigger.dev") {
					const parsedMetadata = GenerationMetadata.parse(
						args.generationMetadata,
					);

					await traceEmbeddingForTeam({
						metrics: args.embeddingMetrics,
						generation: args.generation,
						queryContext: args.queryContext,
						sessionId: args.generation.context.origin.actId,
						userId: parsedMetadata.userId,
						team: {
							id: parsedMetadata.team.id,
							type: parsedMetadata.team.type,
							activeSubscriptionId: parsedMetadata.team.subscriptionId,
						},
					});
					return;
				}
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
});

// Content generation processor: Trigger.dev implementation
//
// This processor delegates content generation to Trigger.dev jobs.
// The branching logic handles two main flows:
//
// 1. setGenerateContentProcess:
//    - Determines user context based on generation origin:
//      a) "github-app": GitHub App automation (no authenticated user)
//         → Fetch team from workspaceId, use "github-app" as userId
//      b) "stage" / "studio": Interactive user sessions
//         → Further branch by runtimeEnv:
//            - "local" / "vercel" / "unknown": Outside Trigger.dev context
//              → Fetch currentUser and currentTeam from session
//            - "trigger.dev": Already inside a Trigger.dev job
//              → Parse user/team from metadata to avoid circular auth calls
//
// 2. setRunActProcess:
//    - Determines user context based on generationOriginType:
//      a) "github-app": GitHub App automation
//         → Fetch team from workspaceId, use "github-app" as userId
//      b) "stage" / "studio": Interactive user sessions
//         → Fetch currentUser and currentTeam from session
//
// Key insight:
// - "github-app" origin has no authenticated user → derive context from workspaceId
// - "stage"/"studio" origin needs user context → fetch from session or metadata
// - When already inside Trigger.dev (runtimeEnv === "trigger.dev"),
//   use metadata to avoid re-fetching auth state
if (generateContentProcessor === "trigger.dev") {
	giselleEngine.setGenerateContentProcess(async ({ generation, metadata }) => {
		const requestId = getRequestId();
		switch (generation.context.origin.type) {
			case "github-app": {
				const team = await getWorkspaceTeam(
					generation.context.origin.workspaceId,
				);
				await jobs.trigger<typeof generateContentJob>("generate-content", {
					generationId: generation.id,
					requestId,
					userId: "github-app",
					team: {
						id: team.id,
						type: team.type,
						subscriptionId: team.activeSubscriptionId,
					},
				});
				break;
			}
			case "stage":
			case "studio": {
				switch (runtimeEnv) {
					case "local":
					case "vercel":
					case "unknown": {
						const [currentUser, currentTeam] = await Promise.all([
							fetchCurrentUser(),
							fetchCurrentTeam(),
						]);
						await jobs.trigger<typeof generateContentJob>("generate-content", {
							generationId: generation.id,
							requestId,
							userId: currentUser.id,
							team: {
								id: currentTeam.id,
								type: currentTeam.type,
								subscriptionId: currentTeam.activeSubscriptionId,
							},
						});
						break;
					}
					case "trigger.dev": {
						const parsedMetadata = GenerationMetadata.parse(metadata);
						await jobs.trigger<typeof generateContentJob>("generate-content", {
							generationId: generation.id,
							requestId,
							...parsedMetadata,
						});
						break;
					}
					default: {
						const _exhaustiveCheck: never = runtimeEnv;
						throw new Error(`Unhandled runtimeEnv: ${_exhaustiveCheck}`);
					}
				}
				break;
			}
			default: {
				const _exhaustiveCheck: never = generation.context.origin;
				throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
			}
		}
	});

	giselleEngine.setRunActProcess(async ({ act, generationOriginType }) => {
		const requestId = getRequestId();
		switch (generationOriginType) {
			case "github-app": {
				const team = await getWorkspaceTeam(act.workspaceId);

				await jobs.trigger<typeof runActJob>("run-act-job", {
					actId: act.id,
					requestId,
					userId: "github-app",
					team: {
						id: team.id,
						type: team.type,
						subscriptionId: team.activeSubscriptionId,
					},
				});
				break;
			}
			case "stage":
			case "studio": {
				const [currentUser, currentTeam] = await Promise.all([
					fetchCurrentUser(),
					fetchCurrentTeam(),
				]);

				await jobs.trigger<typeof runActJob>("run-act-job", {
					actId: act.id,
					requestId,
					userId: currentUser.id,
					team: {
						id: currentTeam.id,
						type: currentTeam.type,
						subscriptionId: currentTeam.activeSubscriptionId,
					},
				});
				break;
			}
			default: {
				const _exhaustiveCheck: never = generationOriginType;
				throw new Error(`Unhandled origin type: ${_exhaustiveCheck}`);
			}
		}
	});
}
