import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { AgentId } from "@giselles-ai/types";
import { and, avg, count, desc, eq, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import { giselleEngine } from "@/app/giselle-engine";
import {
	acts,
	agentActivities,
	agents,
	db,
	supabaseUserMappings,
	teams,
	users,
} from "@/drizzle";
import { getUser } from "@/lib/supabase";

import { AppDetailClient } from "./app-detail-client";

// Constants
const DEFAULT_VALUES = {
	description: "No description",
	teamName: "Unknown Team",
	creatorName: "Unknown Creator",
	agentName: "Untitled Agent",
	favoriteCount: 42,
	executionHistoryLimit: 10,
	recentActivityDays: 7,
} as const;

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

interface AppDetailPageProps {
	params: Promise<{
		appId: string;
	}>;
}

async function extractLLMLabels(workspaceId?: string | null): Promise<string> {
	if (!workspaceId) {
		return "No LLM";
	}

	try {
		const tmpWorkspace = await giselleEngine.getWorkspace(
			workspaceId as WorkspaceId,
			true,
		);

		// Extract LLM models from workspace nodes
		const llmModels: string[] = [];
		if (tmpWorkspace.nodes) {
			for (const node of tmpWorkspace.nodes) {
				if (node.content?.type === "textGeneration" && node.content.llm) {
					const model = node.content.llm.id;
					if (typeof model === "string" && !llmModels.includes(model)) {
						llmModels.push(model);
					}
				}
			}
		}

		if (llmModels.length === 0) {
			return "No LLM";
		} else if (llmModels.length <= 3) {
			return llmModels.join(", ");
		} else {
			return `${llmModels.slice(0, 3).join(", ")} +others`;
		}
	} catch (error) {
		console.error("Error extracting LLM labels:", error);
		return "Mixed models";
	}
}

async function getAppDetails(appId: string) {
	try {
		// Get current user
		const supabaseUser = await getUser();
		const [currentUserMapping] = await db
			.select({ userDbId: supabaseUserMappings.userDbId })
			.from(supabaseUserMappings)
			.where(eq(supabaseUserMappings.supabaseUserId, supabaseUser.id));

		if (!currentUserMapping) {
			throw new Error("User mapping not found");
		}

		// Get agent with team information
		const agentWithTeam = await db
			.select({
				id: agents.id,
				dbId: agents.dbId,
				name: agents.name,
				updatedAt: agents.updatedAt,
				workspaceId: agents.workspaceId,
				createdAt: agents.createdAt,
				teamName: teams.name,
				teamId: teams.id,
				creatorName: users.displayName,
				creatorAvatarUrl: users.avatarUrl,
			})
			.from(agents)
			.leftJoin(teams, eq(agents.teamDbId, teams.dbId))
			.leftJoin(users, eq(agents.creatorDbId, users.dbId))
			.where(eq(agents.id, appId as AgentId))
			.limit(1);

		if (!agentWithTeam[0]) {
			return null;
		}

		const agentData = agentWithTeam[0];

		// Get execution statistics
		const [executionStats] = agentData.workspaceId
			? await db
					.select({
						totalExecutions: count(acts.dbId),
					})
					.from(acts)
					.where(eq(acts.sdkWorkspaceId, agentData.workspaceId))
			: [{ totalExecutions: 0 }];

		// Get recent executions for status determination
		const recentExecutions = agentData.workspaceId
			? await db
					.select({
						createdAt: acts.createdAt,
					})
					.from(acts)
					.where(eq(acts.sdkWorkspaceId, agentData.workspaceId))
					.orderBy(desc(acts.createdAt))
					.limit(5)
			: [];

		// Get runtime statistics from agentActivities
		const [runtimeStats] = await db
			.select({
				avgRuntimeMs: avg(agentActivities.totalDurationMs),
				totalRuntimeMs: sum(agentActivities.totalDurationMs),
			})
			.from(agentActivities)
			.where(eq(agentActivities.agentDbId, agentData.dbId));

		// Determine status based on recent activity
		const hasRecentActivity = recentExecutions.length > 0;
		const lastExecution = recentExecutions[0]?.createdAt;
		const isRecentlyActive =
			lastExecution &&
			Date.now() - lastExecution.getTime() <
				DEFAULT_VALUES.recentActivityDays * MILLISECONDS_IN_DAY;

		const status =
			hasRecentActivity && isRecentlyActive ? "Active" : "Inactive";

		// Calculate runtime display value
		const avgRuntimeSeconds = runtimeStats.avgRuntimeMs
			? Math.round((Number(runtimeStats.avgRuntimeMs) / 1000) * 100) / 100
			: 0;
		const runtimeDisplay =
			avgRuntimeSeconds > 0 ? `${avgRuntimeSeconds}s avg` : "No runtime data";

		// Get execution history for current user
		const executionHistory = agentData.workspaceId
			? await db
					.select({
						id: acts.sdkActId,
						createdAt: acts.createdAt,
						updatedAt: acts.updatedAt,
					})
					.from(acts)
					.where(
						and(
							eq(acts.sdkWorkspaceId, agentData.workspaceId),
							eq(acts.directorDbId, currentUserMapping.userDbId),
						),
					)
					.orderBy(desc(acts.createdAt))
					.limit(DEFAULT_VALUES.executionHistoryLimit)
			: [];

		return {
			id: agentData.id,
			name: agentData.name || DEFAULT_VALUES.agentName,
			description: DEFAULT_VALUES.description,
			owner: agentData.teamName || DEFAULT_VALUES.teamName,
			updatedAt: agentData.updatedAt.toLocaleDateString("ja-JP", {
				year: "numeric",
				month: "numeric",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			}),
			status: status,
			runTime: runtimeDisplay,
			requests: `${executionStats?.totalExecutions || 0} executions`,
			executionCount: executionStats?.totalExecutions || 0,
			totalOutput: "---", // Requires additional metrics tracking
			tokens: "---", // Requires additional metrics tracking
			llm: await extractLLMLabels(agentData.workspaceId),
			isFavorite: false,
			favoriteCount: DEFAULT_VALUES.favoriteCount,
			teamId: agentData.teamId || "",
			workspaceId: agentData.workspaceId || "",
			creator: {
				name: agentData.creatorName || DEFAULT_VALUES.creatorName,
				avatarUrl: agentData.creatorAvatarUrl || undefined,
			},
			previewCard: {
				title: agentData.name || "Untitled Agent",
				creator: agentData.teamName || "Unknown Team",
				stats: {
					likes: "---",
					views: `${executionStats?.totalExecutions || 0}`,
				},
			},
			executionHistory: executionHistory.map((execution) => ({
				id: execution.id,
				status: "success", // TODO: Add actual status tracking
				createdAt: execution.createdAt,
				duration: "---", // TODO: Get actual duration from agentActivities
			})),
		};
	} catch (error) {
		console.error("Error fetching app details:", error);
		return null;
	}
}

export default async function AppDetailPage({ params }: AppDetailPageProps) {
	const resolvedParams = await params;
	const appDetails = await getAppDetails(resolvedParams.appId);

	if (!appDetails) {
		notFound();
	}

	return <AppDetailClient appDetails={appDetails} />;
}
