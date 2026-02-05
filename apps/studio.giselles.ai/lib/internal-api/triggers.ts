"use server";

import { DataQueryError } from "@giselles-ai/giselle";
import type {
	QueuedGeneration,
	Trigger,
	TriggerId,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";

export async function resolveTrigger(input: { generation: QueuedGeneration }) {
	await assertWorkspaceAccess(input.generation.context.origin.workspaceId);
	return { trigger: await giselle.resolveTrigger(input) };
}

export async function configureTrigger(
	input: Parameters<typeof giselle.configureTrigger>[0],
) {
	await assertWorkspaceAccess(input.trigger.workspaceId);
	return { triggerId: await giselle.configureTrigger(input) };
}

export async function getTrigger(input: { triggerId: TriggerId }) {
	const trigger = await giselle.getTrigger(input);
	if (trigger === undefined) {
		return { trigger: undefined };
	}
	await assertWorkspaceAccess(trigger.workspaceId);
	return { trigger };
}

export async function setTrigger(input: { trigger: Trigger }) {
	await assertWorkspaceAccess(input.trigger.workspaceId);
	return { triggerId: await giselle.setTrigger(input) };
}

export async function reconfigureGitHubTrigger(
	input: Parameters<typeof giselle.reconfigureGitHubTrigger>[0],
) {
	const trigger = await giselle.getTrigger({ triggerId: input.triggerId });
	if (trigger === undefined) {
		throw new Error(`Trigger not found: ${input.triggerId}`);
	}
	await assertWorkspaceAccess(trigger.workspaceId);
	return { triggerId: await giselle.reconfigureGitHubTrigger(input) };
}

export async function executeAction(input: { generation: QueuedGeneration }) {
	await assertWorkspaceAccess(input.generation.context.origin.workspaceId);
	await giselle.executeAction(input);
}

export async function executeQuery(input: { generation: QueuedGeneration }) {
	await assertWorkspaceAccess(input.generation.context.origin.workspaceId);
	await giselle.executeQuery(input.generation);
}

export async function executeDataQuery(input: {
	generation: QueuedGeneration;
}) {
	await assertWorkspaceAccess(input.generation.context.origin.workspaceId);
	try {
		await giselle.executeDataQuery(input.generation);
	} catch (error) {
		if (error instanceof DataQueryError) {
			// User-caused errors (SQL syntax, connection issues, etc.) should not go to Sentry.
			// The generation status is already persisted as "failed" by execute-data-query.ts.
			return;
		}
		throw error;
	}
}

export async function getGitHubRepositoryFullname(
	input: Parameters<typeof giselle.getGitHubRepositoryFullname>[0] & {
		workspaceId: WorkspaceId;
	},
) {
	await assertWorkspaceAccess(input.workspaceId);
	return {
		fullname: await giselle.getGitHubRepositoryFullname({
			repositoryNodeId: input.repositoryNodeId,
			installationId: input.installationId,
		}),
	};
}
