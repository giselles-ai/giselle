"use server";

import type {
	Generation,
	GenerationId,
	GenerationOrigin,
	NodeId,
	QueuedGeneration,
} from "@giselles-ai/protocol";
import { isQueuedGeneration } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";

export async function getGeneration(input: { generationId: GenerationId }) {
	const generation = await giselle.getGeneration(input.generationId);
	await assertWorkspaceAccess(generation.context.origin.workspaceId);
	return generation;
}

export async function getNodeGenerations(input: {
	origin: GenerationOrigin;
	nodeId: NodeId;
}) {
	await assertWorkspaceAccess(input.origin.workspaceId);
	const generations = await giselle.getNodeGenerations(
		input.origin,
		input.nodeId,
	);
	// The storage path is not scoped by workspace, so verify that every
	// returned generation actually belongs to the caller's workspace.
	return generations.filter(
		(g) => g.context.origin.workspaceId === input.origin.workspaceId,
	);
}

export async function cancelGeneration(input: { generationId: GenerationId }) {
	const generation = await giselle.getGeneration(input.generationId);
	await assertWorkspaceAccess(generation.context.origin.workspaceId);
	return await giselle.cancelGeneration(input.generationId);
}

function isNoSuchKeyError(error: unknown) {
	return error instanceof Error && error.name === "NoSuchKey";
}

export async function setGeneration(input: { generation: Generation }) {
	let existingGeneration: Awaited<ReturnType<typeof giselle.getGeneration>> | undefined;
	try {
		existingGeneration = await giselle.getGeneration(input.generation.id);
	} catch (error) {
		if (!isNoSuchKeyError(error)) {
			throw error;
		}
		// Generation doesn't exist, verify access to the target workspace for new generation creation
		await assertWorkspaceAccess(input.generation.context.origin.workspaceId);
		await giselle.setGeneration(input.generation);
		return;
	}

	// Update existing generation, verify access to the existing workspace
	await assertWorkspaceAccess(existingGeneration.context.origin.workspaceId);
	await giselle.setGeneration({
		...input.generation,
		context: {
			...input.generation.context,
			origin: existingGeneration.context.origin,
		},
	});
}

export async function generateImage(input: { generation: QueuedGeneration }) {
	const storedGeneration = await giselle.getGeneration(input.generation.id);
	if (!isQueuedGeneration(storedGeneration)) {
		throw new Error("Generation is not queued");
	}
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	await giselle.generateImage(storedGeneration);
}

export async function startContentGeneration(input: {
	generation: Generation;
}) {
	let storedGeneration: Awaited<ReturnType<typeof giselle.getGeneration>> | undefined;
	try {
		storedGeneration = await giselle.getGeneration(input.generation.id);
	} catch (error) {
		if (!isNoSuchKeyError(error)) {
			throw error;
		}
		// Generation doesn't exist, verify access to the target workspace for new generation creation
		await assertWorkspaceAccess(input.generation.context.origin.workspaceId);
		const generation = await giselle.startContentGeneration(input);
		return { generation };
	}

	// Generation exists, verify access to the existing workspace
	await assertWorkspaceAccess(storedGeneration.context.origin.workspaceId);
	const generation = await giselle.startContentGeneration({
		generation: storedGeneration,
	});
	return { generation };
}

export async function getGenerationMessageChunks(input: {
	generationId: GenerationId;
	startByte?: number;
}) {
	const generation = await giselle.getGeneration(input.generationId);
	await assertWorkspaceAccess(generation.context.origin.workspaceId);
	return await giselle.getGenerationMessageChunks({
		generationId: input.generationId,
		startByte: input.startByte,
	});
}
