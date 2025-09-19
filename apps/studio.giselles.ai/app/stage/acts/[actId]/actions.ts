"use server";

import type { Generation } from "@giselle-sdk/giselle";
import { GenerationId } from "@giselle-sdk/giselle";
import { giselleEngine } from "@/app/giselle-engine";

export async function fetchGenerationData(
  generationId: string,
): Promise<Generation | undefined> {
  // Guard against invalid IDs using schema validation
  if (!GenerationId.safeParse(generationId).success) {
    console.warn("fetchGenerationData: invalid generationId", generationId);
    return undefined;
  }
  try {
    return await giselleEngine.getGeneration(
      generationId as `gnr-${string}`,
      true,
    );
  } catch (error) {
    console.warn("Failed to fetch generation:", generationId, error);
    return undefined;
  }
}
