"use server";
import {
	type Generation,
	isQueuedGeneration,
	type QueuedGeneration,
	type Trigger,
	type TriggerId,
} from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { assertGenerationResourceAccess } from "@/lib/assert-generation-resource-access";
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

function enforceStudioOriginForCreation<T extends Generation>(generation: T): T {
	const { workspaceId } = generation.context.origin;
	return {
		...generation,
		context: {
			...generation.context,
			origin: {
				type: "studio",
				workspaceId,
			},
		},
	};
}

export async function resolveTrigger(input: { generation: QueuedGeneration }) {
	const storedGeneration = await giselle.getGeneration(input.generation.id);
	if (!isQueuedGeneration(storedGeneration)) {
		throw new Error("Generation is not queued");
	}
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	return {
		trigger: await giselle.resolveTrigger({ generation: storedGeneration }),
	};
}

export async function configureTrigger(
	input: Parameters<typeof giselle.configureTrigger>[0],
) {
	const checks: Promise<void>[] = [
		assertWorkspaceAccess(input.trigger.workspaceId),
	];
	if (input.trigger.configuration.provider === "github") {
		checks.push(
			assertGitHubInstallationAccess(
				input.trigger.configuration.installationId,
			),
		);
	}
	await Promise.all(checks);
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
	const existingTrigger = await giselle.getTrigger({
		triggerId: input.trigger.id,
	});
	if (existingTrigger === undefined) {
		throw new Error("Trigger not found");
	}
	const checks: Promise<void>[] = [
		assertWorkspaceAccess(existingTrigger.workspaceId),
	];
	if (input.trigger.configuration.provider === "github") {
		checks.push(
			assertGitHubInstallationAccess(
				input.trigger.configuration.installationId,
			),
		);
	}
	await Promise.all(checks);
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
	await Promise.all([
		assertWorkspaceAccess(trigger.workspaceId),
		assertGitHubInstallationAccess(input.installationId),
	]);
	return { triggerId: await giselle.reconfigureGitHubTrigger(input) };
}

export async function executeAction(input: { generation: QueuedGeneration }) {
	const storedGeneration = await giselle.getGeneration(input.generation.id);
	if (!isQueuedGeneration(storedGeneration)) {
		throw new Error("Generation is not queued");
	}
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	await giselle.executeAction({ generation: storedGeneration });
}

export async function executeQuery(input: { generation: QueuedGeneration }) {
	const storedGeneration = await giselle.getGeneration(input.generation.id);
	if (!isQueuedGeneration(storedGeneration)) {
		throw new Error("Generation is not queued");
	}
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	await giselle.executeQuery(storedGeneration);
}

// Unlike executeAction/executeQuery, this does NOT fetch the stored generation first.
// The generation has not been persisted to storage yet at this point —
// startDataQueryExecution handles both persistence and execution initiation.
export async function startDataQueryExecution(input: {
	generation: QueuedGeneration;
}) {
	const generation = enforceStudioOriginForCreation(input.generation);
	await assertWorkspaceAccess(generation.context.origin.workspaceId);
	await assertGenerationResourceAccess(generation);
	await giselle.startDataQueryExecution({ generation });
}

export async function getGitHubRepositoryFullname(
	input: Parameters<typeof giselle.getGitHubRepositoryFullname>[0],
) {
	await assertGitHubInstallationAccess(input.installationId);
	return {
		fullname: await giselle.getGitHubRepositoryFullname(input),
	};
}
