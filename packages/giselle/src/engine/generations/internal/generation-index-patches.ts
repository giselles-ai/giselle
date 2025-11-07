import type { GenerationId, NodeGenerationIndex } from "@giselles-ai/protocol";

export type GenerationIndexPatch =
	| { type: "upsert"; index: NodeGenerationIndex }
	| { type: "remove"; generationId: GenerationId };

export function applyPatches(
	current: NodeGenerationIndex[] | undefined,
	patches: GenerationIndexPatch[],
): NodeGenerationIndex[] {
	let result = current ? [...current] : [];

	for (const patch of patches) {
		if (patch.type === "upsert") {
			const existingIndex = result.findIndex(
				(item) => item.id === patch.index.id,
			);
			if (existingIndex === -1) {
				result.push(patch.index);
			} else {
				result[existingIndex] = patch.index;
			}
		} else {
			result = result.filter((item) => item.id !== patch.generationId);
		}
	}

	return result;
}

export function upsert(index: NodeGenerationIndex): GenerationIndexPatch {
	return { type: "upsert", index };
}
