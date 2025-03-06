import {
	CancelledGeneration,
	CompletedGeneration,
	FailedGeneration,
	type Generation,
	type GenerationId,
	RunningGeneration,
} from "@giselle-sdk/data-type";
import { z } from "zod";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const exponentialBackoff = (interval: number) => {
	return interval * 2;
};

type GenerationFetcher = (
	generationId: GenerationId,
) => Promise<Generation | undefined>;

interface RequestOptions {
	initialInterval?: number;
	maxAttempts?: number;
}
async function waitAndGetGenerationStatus(
	fetcher: GenerationFetcher,
	generationId: GenerationId,
	status: Array<z.infer<typeof Generation>["status"]>,
	{ initialInterval = 500, maxAttempts = 10 }: RequestOptions = {},
) {
	let currentInterval = initialInterval;
	let attempts = 0;

	while (attempts < maxAttempts) {
		const generation = await fetcher(generationId);

		if (generation !== undefined && status.includes(generation.status)) {
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
	fetcher: GenerationFetcher,
	generationId: GenerationId,
	requestOptions?: RequestOptions,
) {
	const generation = await waitAndGetGenerationStatus(
		fetcher,
		generationId,
		["completed"],
		requestOptions,
	);
	return CompletedGeneration.parse(generation);
}

export async function waitAndGetGenerationRunning(
	fetcher: GenerationFetcher,
	generationId: GenerationId,
	requestOptions?: RequestOptions,
) {
	const generation = await waitAndGetGenerationStatus(
		fetcher,
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
	fetcher: GenerationFetcher,
	generationId: GenerationId,
	requestOptions?: RequestOptions,
) {
	const failedGeneration = await waitAndGetGenerationStatus(
		fetcher,
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
