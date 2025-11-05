"use server";

import type { WorkspaceId } from "@giselle-ai/protocol";
import { isTriggerNode } from "@giselle-ai/protocol";
import type { AgentId } from "@giselles-ai/types";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { giselleEngine } from "@/app/giselle-engine";
import {
	agents,
	db,
	flowTriggers,
	githubIntegrationSettings,
	workspaces,
} from "@/db";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";

interface AgentDuplicationSuccess {
	result: "success";
	workspaceId: WorkspaceId;
}
interface AgentDuplicationError {
	result: "error";
	message: string;
}
type AgentDuplicationResult = AgentDuplicationSuccess | AgentDuplicationError;

type DeleteAgentResult =
	| { result: "success"; message: string }
	| { result: "error"; message: string };

export async function copyAgent(
	agentId: AgentId,
): Promise<AgentDuplicationResult> {
	if (typeof agentId !== "string" || agentId.length === 0) {
		return { result: "error", message: "Please fill in the agent id" };
	}

	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.id, agentId as AgentId),
	});
	if (agent === undefined) {
		return { result: "error", message: `${agentId} is not found.` };
	}

	try {
		const [user, team] = await Promise.all([
			fetchCurrentUser(),
			fetchCurrentTeam(),
		]);
		if (agent.teamDbId !== team.dbId) {
			return {
				result: "error",
				message: "You are not allowed to duplicate this workspace",
			};
		}

		if (agent.workspaceId === null) {
			return {
				result: "error",
				message: "Workspace not found",
			};
		}

		const newAgentId = `agnt_${createId()}` as AgentId;
		const baseName = agent.name?.trim() || agentId;
		const newName = `Copy of ${baseName}`;
		const workspace = await giselleEngine.copyWorkspace(
			agent.workspaceId,
			newName,
		);
		// The agents table is deprecated, so we are inserting into the workspaces table.
		await db.insert(agents).values({
			id: newAgentId,
			name: newName,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			workspaceId: workspace.id,
		});
		await db.insert(workspaces).values({
			id: workspace.id,
			name: workspace.name,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
		});

		// Copy flowTrigger DB records for staged triggers
		for (const node of workspace.nodes) {
			if (!isTriggerNode(node) || node.content.state.status !== "configured") {
				continue;
			}

			const flowTrigger = await giselleEngine.getTrigger({
				flowTriggerId: node.content.state.flowTriggerId,
			});
			if (
				flowTrigger &&
				flowTrigger.configuration.provider === "manual" &&
				flowTrigger.configuration.staged
			) {
				await db.insert(flowTriggers).values({
					teamDbId: team.dbId,
					sdkFlowTriggerId: node.content.state.flowTriggerId,
					sdkWorkspaceId: workspace.id,
					staged: true,
				});
			}
		}

		return { result: "success", workspaceId: workspace.id };
	} catch (error) {
		console.error("Failed to copy agent:", error);
		return {
			result: "error",
			message: `Failed to copy agent: ${error instanceof Error ? error.message : "Unknown error"}`,
		};
	}
}

export async function deleteAgent(agentId: string): Promise<DeleteAgentResult> {
	if (typeof agentId !== "string" || agentId.length === 0) {
		return { result: "error", message: "Invalid agent id" };
	}

	try {
		const agent = await db.query.agents.findFirst({
			where: (agents, { eq }) => eq(agents.id, agentId as AgentId),
		});

		if (agent === undefined) {
			return { result: "error", message: `Agent ${agentId} not found` };
		}

		const team = await fetchCurrentTeam();
		if (agent.teamDbId !== team.dbId) {
			return {
				result: "error",
				message: "You are not allowed to delete this workspace",
			};
		}

		// Delete the agent from database
		await db.transaction(async (tx) => {
			// Delete related flowTriggers first
			if (agent.workspaceId) {
				await tx
					.delete(flowTriggers)
					.where(eq(flowTriggers.sdkWorkspaceId, agent.workspaceId));
				await tx.delete(workspaces).where(eq(workspaces.id, agent.workspaceId));
			}
			await tx
				.delete(githubIntegrationSettings)
				.where(eq(githubIntegrationSettings.agentDbId, agent.dbId));
			await tx.delete(agents).where(eq(agents.id, agentId as AgentId));
		});

		return {
			result: "success",
			message: "Agent deleted successfully",
		};
	} catch (error) {
		console.error("Failed to delete agent:", error);
		return {
			result: "error",
			message: `Failed to delete agent: ${error instanceof Error ? error.message : "Unknown error"}`,
		};
	}
}
