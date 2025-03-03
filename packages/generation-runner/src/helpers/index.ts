import {
	CancelledGeneration,
	CompletedGeneration,
	FailedGeneration,
	type Generation,
	type GenerationId,
	RunningGeneration,
} from "@giselle-sdk/data-type";
import { callGetGenerationApi } from "@giselle-sdk/giselle-engine/client";
import { z } from "zod";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const exponentialBackoff = (interval: number) => {
	return interval * 2;
};
interface RequestOptions {
	initialInterval?: number;
	maxAttempts?: number;
}
async function waitAndGetGenerationStatus(
	generationId: GenerationId,
	status: Array<z.infer<typeof Generation>["status"]>,
	{ initialInterval = 500, maxAttempts = 10 }: RequestOptions = {},
) {
	let currentInterval = initialInterval;
	let attempts = 0;

	while (attempts < maxAttempts) {
		const generation = await callGetGenerationApi({
			generationId,
		});

		if (status.includes(generation.status)) {
			return generation;
		}

		// Wait for the current interval
		await wait(currentInterval);

		// Increase the interval exponentially
		currentInterval = exponentialBackoff(currentInterval);
		attempts++;
	}

	throw new Error("Maximum polling attempts reached without completion");
}

export async function waitAndGetGenerationCompleted(
	generationId: GenerationId,
	requestOptions?: RequestOptions,
) {
	const generation = await waitAndGetGenerationStatus(
		generationId,
		["completed"],
		requestOptions,
	);
	return CompletedGeneration.parse(generation);
}

export async function waitAndGetGenerationRunning(
	generationId: GenerationId,
	requestOptions?: RequestOptions,
) {
	const generation = await waitAndGetGenerationStatus(
		generationId,
		["running", "completed", "failed", "cancelled"],
		requestOptions,
	);
	return z
		.union([
			RunningGeneration,
			CompletedGeneration,
			FailedGeneration,
			CancelledGeneration,
		])
		.parse(generation);
}

export async function waitAndGetGenerationFailed(
	generationId: GenerationId,
	requestOptions?: RequestOptions,
) {
	const failedGeneration = await waitAndGetGenerationStatus(
		generationId,
		["failed"],
		requestOptions,
	);
	return FailedGeneration.parse(failedGeneration);
}

export function arrayEquals(a: unknown, b: unknown) {
	return (
		Array.isArray(a) &&
		Array.isArray(b) &&
		a.length === b.length &&
		a.every((val, index) => val === b[index])
	);
}
