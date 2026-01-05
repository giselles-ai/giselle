import type { AiGatewayHeaders, QueryContext } from "@giselles-ai/giselle";
import { traceEmbedding } from "@giselles-ai/langfuse";
import { getRequestId, NextGiselle } from "@giselles-ai/nextjs/internal";
import { type RunningGeneration, WorkspaceId } from "@giselles-ai/protocol";
import type { EmbeddingMetrics } from "@giselles-ai/rag";
import {
	supabaseStorageDriver as experimental_supabaseStorageDriver,
	supabaseVaultDriver,
} from "@giselles-ai/supabase-driver";
import { tasks as jobs } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { apps, db, tasks } from "@/db";
import { generateContentNodeFlag } from "@/flags";
import { GenerationMetadata } from "@/lib/generation-metadata";
import { logger } from "@/lib/logger";
import { traceGenerationForTeam } from "@/lib/trace";
import { getWorkspaceTeam } from "@/lib/workspaces/get-workspace-team";
import { fetchUsageLimits } from "@/packages/lib/fetch-usage-limits";
import { onConsumeAgentTime } from "@/packages/lib/on-consume-agent-time";
import { fetchCurrentUser } from "@/services/accounts";
import { type CurrentTeam, fetchCurrentTeam } from "@/services/teams";
import type { runTaskJob } from "@/trigger/run-task-job";
import { getDocumentVectorStoreQueryService } from "../lib/vector-stores/document/query/service";
import {
	gitHubIssueQueryService,
	gitHubPullRequestQueryService,
	gitHubQueryService,
} from "../lib/vector-stores/github";
import type { generateContentJob } from "../trigger/generate-content-job";

const storage = experimental_supabaseStorageDriver({
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

type TeamForPlan = Pick<
	CurrentTeam,
	"id" | "activeSubscriptionId" | "activeCustomerId" | "plan"
>;

async function traceEmbeddingForTeam(args: {
	metrics: EmbeddingMetrics;
	generation: RunningGeneration;
	queryContext: QueryContext;
	sessionId?: string;
	userId: string;
	team: TeamForPlan;
}) {
	const teamPlan = args.team.plan;
	const planTag = `plan:${teamPlan}`;

	const { queryContext } = args;
	const baseMetadata = {
		generationId: args.generation.id,
		teamId: args.team.id,
		teamPlan,
		userId: args.userId,
		subscriptionId: args.team.activeSubscriptionId ?? "",
		customerId: args.team.activeCustomerId ?? "",
		resourceProvider: queryContext.provider,
		workspaceId: queryContext.workspaceId,
		embeddingProfileId: queryContext.embeddingProfileId,
	};

	const traceArgs = {
		metrics: args.metrics,
		userId: args.userId,
		sessionId: args.sessionId,
		tags: [planTag, "embedding-purpose:query"],
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

function parseEnvNumber(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

const runtimeEnv = getRuntimeEnv();

const generateContentProcessor =
	process.env.USE_TRIGGER_DEV === "1" ||
	runtimeEnv === "trigger.dev" ||
	(runtimeEnv === "vercel" && process.env.NODE_ENV !== "development")
		? "trigger.dev"
		: "self";

export const giselle = NextGiselle({
	basePath: "/api/giselle",
	storage,
	llmProviders: ["openai", "anthropic", "google"],
	apiSecretScrypt: {
		params: {
			n: parseEnvNumber(process.env.GISELLE_API_SECRET_SCRYPT_N, 16384),
			r: parseEnvNumber(process.env.GISELLE_API_SECRET_SCRYPT_R, 8),
			p: parseEnvNumber(process.env.GISELLE_API_SECRET_SCRYPT_P, 1),
			keyLen: parseEnvNumber(process.env.GISELLE_API_SECRET_SCRYPT_KEY_LEN, 32),
		},
		saltBytes: parseEnvNumber(
			process.env.GISELLE_API_SECRET_SCRYPT_SALT_BYTES,
			16,
		),
		logDuration: process.env.GISELLE_API_SECRET_SCRYPT_LOG_DURATION === "1",
	},
	onConsumeAgentTime,
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
					installationIds: () => [1234],
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
		githubIssue: gitHubIssueQueryService,
		githubPullRequest: gitHubPullRequestQueryService,
		document: getDocumentVectorStoreQueryService(),
	},
	callbacks: {
		appCreate: async ({ app }) => {
			const currentTeam = await fetchCurrentTeam();
			const workspace = await db.query.workspaces.findFirst({
				where: (workspaces, { eq }) => eq(workspaces.id, app.workspaceId),
			});
			if (workspace === undefined) {
				throw new Error(`Workspace not found for app ${app.id}`);
			}
			await db.insert(apps).values({
				id: app.id,
				appEntryNodeId: app.entryNodeId,
				endNodeId: app.state === "connected" ? app.endNodeId : null,
				teamDbId: currentTeam.dbId,
				workspaceDbId: workspace.dbId,
			});
		},
		appDelete: async ({ appId }) => {
			await db.delete(apps).where(eq(apps.id, appId));
		},
		appConnectionChange: async (args) => {
			switch (args.event) {
				case "connected": {
					const app = args.payload.app;
					await db
						.update(apps)
						.set({
							appEntryNodeId: app.entryNodeId,
							endNodeId: app.endNodeId,
						})
						.where(eq(apps.id, app.id));
					break;
				}
				case "disconnected": {
					const app = args.payload.app;
					await db
						.update(apps)
						.set({
							appEntryNodeId: app.entryNodeId,
							endNodeId: null,
						})
						.where(eq(apps.id, app.id));
					break;
				}
				default: {
					const _exhaustiveCheck: never = args;
					throw new Error(`Unhandled event: ${_exhaustiveCheck}`);
				}
			}
		},
		generationComplete: async (args) => {
			const requestId = getRequestId();
			if (
				args.generation.context.origin.type === "github-app" ||
				args.generation.context.origin.type === "api"
			) {
				const team = await getWorkspaceTeam(
					args.generation.context.origin.workspaceId,
				);
				await traceGenerationForTeam({
					...args,
					requestId,
					userId:
						args.generation.context.origin.type === "github-app"
							? "github-app"
							: "api",
					team,
					sessionId: args.generation.context.origin.taskId,
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
				sessionId: args.generation.context.origin.taskId,
			});
		},
		generationError: async (args) => {
			const requestId = getRequestId();
			if (
				args.generation.context.origin.type === "github-app" ||
				args.generation.context.origin.type === "api"
			) {
				const team = await getWorkspaceTeam(
					args.generation.context.origin.workspaceId,
				);
				await traceGenerationForTeam({
					...args,
					requestId,
					userId:
						args.generation.context.origin.type === "github-app"
							? "github-app"
							: "api",
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
						sessionId: args.generation.context.origin.taskId,
						userId: parsedMetadata.userId,
						team: {
							id: parsedMetadata.team.id,
							activeSubscriptionId: parsedMetadata.team.subscriptionId,
							activeCustomerId: parsedMetadata.team.activeCustomerId,
							plan: parsedMetadata.team.plan,
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
							sessionId: args.generation.context.origin.taskId,
							userId: "github-app",
							team,
						});
						break;
					}
					case "api": {
						const team = await getWorkspaceTeam(
							args.generation.context.origin.workspaceId,
						);
						await traceEmbeddingForTeam({
							metrics: args.embeddingMetrics,
							generation: args.generation,
							queryContext: args.queryContext,
							sessionId: args.generation.context.origin.taskId,
							userId: "api",
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
							sessionId: args.generation.context.origin.taskId,
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
		taskCreate: async ({ task }) => {
			let appDbId: number | undefined;

			if (task.starter.type === "app") {
				const appId = task.starter.appId;
				const app = await db.query.apps.findFirst({
					where: (apps, { eq }) => eq(apps.id, appId),
					columns: {
						dbId: true,
					},
				});
				appDbId = app?.dbId;
			}
			if (
				task.starter.type === "github-trigger" &&
				task.starter.end.type === "endNode"
			) {
				const appId = task.starter.end.appId;
				const app = await db.query.apps.findFirst({
					where: (apps, { eq }) => eq(apps.id, appId),
					columns: {
						dbId: true,
					},
				});
				appDbId = app?.dbId;
			}

			const workspace = await db.query.workspaces.findFirst({
				where: (workspaces, { eq }) => eq(workspaces.id, task.workspaceId),
				columns: {},
				with: {
					team: {
						columns: {
							dbId: true,
						},
					},
				},
			});
			if (workspace === undefined) {
				throw new Error(`Workspace not found for task ${task.id}`);
			}

			await db.insert(tasks).values({
				id: task.id,
				appDbId,
				teamDbId: workspace.team.dbId,
			});
		},
		buildAiGatewayHeaders: ({ metadata, generation }) => {
			const parsedMetadata = GenerationMetadata.safeParse(metadata);
			const stripeCustomerId = parsedMetadata.success
				? (parsedMetadata.data.team.activeCustomerId ?? undefined)
				: undefined;
			const teamPlan = parsedMetadata.success
				? parsedMetadata.data.team.plan
				: undefined;
			const aiGatewayHeaders: AiGatewayHeaders = {
				"http-referer":
					process.env.AI_GATEWAY_HTTP_REFERER ?? "https://giselles.ai",
				"x-title": process.env.AI_GATEWAY_X_TITLE ?? "Giselle",
			};
			if (stripeCustomerId !== undefined) {
				aiGatewayHeaders["stripe-customer-id"] = stripeCustomerId;
				aiGatewayHeaders["stripe-restricted-access-key"] =
					process.env.STRIPE_AI_GATEWAY_RESTRICTED_ACCESS_KEY ?? "";
			} else if (teamPlan === "pro" || teamPlan === "team") {
				logger.warn(
					`Stripe customer ID not found for generation ${generation.id}`,
				);
			}
			return aiGatewayHeaders;
		},
	},
	logger,
	async onRequest({ updateContext }) {
		const useGenerateContentNode = await generateContentNodeFlag();
		updateContext({
			experimental_contentGenerationNode: useGenerateContentNode,
		});
	},
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
	giselle.setGenerateContentProcess(async ({ generation, metadata }) => {
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
						subscriptionId: team.activeSubscriptionId,
						activeCustomerId: team.activeCustomerId,
						plan: team.plan,
					},
				});
				break;
			}
			case "api": {
				const team = await getWorkspaceTeam(
					generation.context.origin.workspaceId,
				);
				await jobs.trigger<typeof generateContentJob>("generate-content", {
					generationId: generation.id,
					requestId,
					userId: "api",
					team: {
						id: team.id,
						subscriptionId: team.activeSubscriptionId,
						activeCustomerId: team.activeCustomerId,
						plan: team.plan,
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
								subscriptionId: currentTeam.activeSubscriptionId,
								activeCustomerId: currentTeam.activeCustomerId,
								plan: currentTeam.plan,
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

	giselle.setRunTaskProcess(async ({ task, generationOriginType }) => {
		const requestId = getRequestId();
		switch (generationOriginType) {
			case "github-app": {
				const team = await getWorkspaceTeam(task.workspaceId);

				await jobs.trigger<typeof runTaskJob>("run-task-job", {
					taskId: task.id,
					requestId,
					userId: "github-app",
					team: {
						id: team.id,
						subscriptionId: team.activeSubscriptionId,
						activeCustomerId: team.activeCustomerId,
						plan: team.plan,
					},
				});
				break;
			}
			case "api": {
				const team = await getWorkspaceTeam(task.workspaceId);

				await jobs.trigger<typeof runTaskJob>("run-task-job", {
					taskId: task.id,
					requestId,
					userId: "api",
					team: {
						id: team.id,
						subscriptionId: team.activeSubscriptionId,
						activeCustomerId: team.activeCustomerId,
						plan: team.plan,
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

				await jobs.trigger<typeof runTaskJob>("run-task-job", {
					taskId: task.id,
					requestId,
					userId: currentUser.id,
					team: {
						id: currentTeam.id,
						subscriptionId: currentTeam.activeSubscriptionId,
						activeCustomerId: currentTeam.activeCustomerId,
						plan: currentTeam.plan,
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
