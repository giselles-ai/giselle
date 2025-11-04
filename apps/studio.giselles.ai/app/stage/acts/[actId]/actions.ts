"use server";

import type { Generation } from "@giselle-ai/giselle";
import { giselleEngine } from "@/app/giselle-engine";

export async function fetchGenerationData(
	generationId: string,
): Promise<Generation | undefined> {
	try {
		return await giselleEngine.getGeneration(generationId as `gnr-${string}`);
	} catch (error) {
		console.warn("Failed to fetch generation:", generationId, error);
		return undefined;
	}
}
