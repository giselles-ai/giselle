"use server";

import { DataQueryError } from "@giselles-ai/giselle";
import {
	isQueuedGeneration,
	type QueuedGeneration,
	type Trigger,
	type TriggerId,
} from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";
import { getGitHubIdentityState } from "@/services/accounts";

async function assertGitHubInstallationAccess(installationId: number) {
	const githubIdentityState = await getGitHubIdentityState();
	if (githubIdentityState.status !== "authorized") {
		throw new Error("GitHub authentication required");
	}
	const { installations } =
		await githubIdentityState.gitHubUserClient.getInstallations();
	const hasAccess = installations.some((inst) => inst.id === installationId);
	if (!hasAccess) {
		throw new Error("Installation not found");
	}
}

export async function resolveTrigger(input: { generation: QueuedGeneration }) {
	const storedGeneration = await giselle.getGeneration(input.generation.id);
	if (storedGeneration === undefined || !isQueuedGeneration(storedGeneration)) {
		throw new Error("Generation not found");
	}
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	return { trigger: await giselle.resolveTrigger({ generation: storedGeneration }) };
}

export async function configureTrigger(
	input: Parameters<typeof giselle.configureTrigger>[0],
) {
	await assertWorkspaceAccess(input.trigger.workspaceId);
	if (input.trigger.configuration.provider === "github") {
		await assertGitHubInstallationAccess(
			input.trigger.configuration.installationId,
		);
	}
	return { triggerId: await giselle.configureTrigger(input) };
}

export async function getTrigger(input: { triggerId: TriggerId }) {
	const trigger = await giselle.getTrigger(input);
	if (trigger === undefined) {
		return { trigger: undefined };
	}
	try {
		await assertWorkspaceAccess(trigger.workspaceId);
	} catch {
		// Return same response for unauthorized as for not found to prevent existence leak
		return { trigger: undefined };
	}
	return { trigger };
}

export async function setTrigger(input: { trigger: Trigger }) {
	const existingTrigger = await giselle.getTrigger({
		triggerId: input.trigger.id,
	});
	if (existingTrigger === undefined) {
		throw new Error("Trigger not found");
	}
	try {
		await assertWorkspaceAccess(existingTrigger.workspaceId);
	} catch {
		// Throw same error as not found to prevent existence leak
		throw new Error("Trigger not found");
	}
	if (input.trigger.configuration.provider === "github") {
		await assertGitHubInstallationAccess(
			input.trigger.configuration.installationId,
		);
	}
	return {
		triggerId: await giselle.setTrigger({
			trigger: { ...input.trigger, workspaceId: existingTrigger.workspaceId },
		}),
	};
}

export async function reconfigureGitHubTrigger(
	input: Parameters<typeof giselle.reconfigureGitHubTrigger>[0],
) {
	const trigger = await giselle.getTrigger({ triggerId: input.triggerId });
	if (trigger === undefined) {
		throw new Error("Trigger not found");
	}
	try {
		await assertWorkspaceAccess(trigger.workspaceId);
	} catch {
		// Throw same error as not found to prevent existence leak
		throw new Error("Trigger not found");
	}
	await assertGitHubInstallationAccess(input.installationId);
	return { triggerId: await giselle.reconfigureGitHubTrigger(input) };
}

export async function executeAction(input: { generation: QueuedGeneration }) {
	const storedGeneration = await giselle.getGeneration(input.generation.id);
	if (storedGeneration === undefined || !isQueuedGeneration(storedGeneration)) {
		throw new Error("Generation not found");
	}
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	await giselle.executeAction({ generation: storedGeneration });
}

export async function executeQuery(input: { generation: QueuedGeneration }) {
	const storedGeneration = await giselle.getGeneration(input.generation.id);
	if (storedGeneration === undefined || !isQueuedGeneration(storedGeneration)) {
		throw new Error("Generation not found");
	}
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	await giselle.executeQuery(storedGeneration);
}

export async function executeDataQuery(input: {
	generation: QueuedGeneration;
}) {
	const storedGeneration = await giselle.getGeneration(input.generation.id);
	if (storedGeneration === undefined || !isQueuedGeneration(storedGeneration)) {
		throw new Error("Generation not found");
	}
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	try {
		await giselle.executeDataQuery(storedGeneration);
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
	input: Parameters<typeof giselle.getGitHubRepositoryFullname>[0],
) {
	await assertGitHubInstallationAccess(input.installationId);
	return {
		fullname: await giselle.getGitHubRepositoryFullname(input),
	};
}
