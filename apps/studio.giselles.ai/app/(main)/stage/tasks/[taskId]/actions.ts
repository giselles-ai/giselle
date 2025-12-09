"use server";

import type { Generation } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

export async function fetchGenerationData(
	generationId: string,
): Promise<Generation | undefined> {
	try {
		return await giselle.getGeneration(generationId as `gnr-${string}`);
	} catch (error) {
		console.warn("Failed to fetch generation:", generationId, error);
		return undefined;
	}
}
