"use server";

import { giselleEngine } from "@/app/giselle-engine";
import { agents, db, githubIntegrationSettings } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { AgentId } from "@giselles-ai/types";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

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
				message: "You are not allowed to duplicate this app",
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
		await db.insert(agents).values({
			id: newAgentId,
			name: newName,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			workspaceId: workspace.id,
		});

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

	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.id, agentId as AgentId),
	});

	if (agent === undefined || agent.graphUrl === null) {
		return { result: "error", message: `Agent ${agentId} not found` };
	}

	const team = await fetchCurrentTeam();
	if (agent.teamDbId !== team.dbId) {
		return {
			result: "error",
			message: "You are not allowed to delete this app",
		};
	}

	try {
		// Delete the agent from database
		await db.transaction(async (tx) => {
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
