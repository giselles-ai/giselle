"use server";

import type {
	Generation,
	GenerationId,
	GenerationOrigin,
	NodeId,
	QueuedGeneration,
	RunningGeneration,
} from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

export async function getGeneration(input: { generationId: GenerationId }) {
	return await giselle.getGeneration(input.generationId);
}

export async function getNodeGenerations(input: {
	origin: GenerationOrigin;
	nodeId: NodeId;
}) {
	return await giselle.getNodeGenerations(input.origin, input.nodeId);
}

export async function cancelGeneration(input: { generationId: GenerationId }) {
	return await giselle.cancelGeneration(input.generationId);
}

export async function setGeneration(input: { generation: Generation }) {
	await giselle.setGeneration(input.generation);
}

export async function generateImage(input: { generation: QueuedGeneration }) {
	await giselle.generateImage(input.generation);
}

export async function startContentGeneration(input: {
	generation: Generation;
}) {
	const generation = await giselle.startContentGeneration(input);
	return { generation };
}

export async function getGenerationMessageChunks(input: {
	generationId: GenerationId;
	startByte?: number;
}) {
	return await giselle.getGenerationMessageChunks({
		generationId: input.generationId,
		startByte: input.startByte,
	});
}

export async function generateContent(input: {
	generation: RunningGeneration;
}) {
	const generation = await giselle.generateContent({
		generation: input.generation,
	});
	return { generation };
}
