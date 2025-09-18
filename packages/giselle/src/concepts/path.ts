import type { ActId, GenerationId } from "./identifiers";

export function actGenerationIndexesPath(actId: ActId) {
	return `generations/byAct/${actId}.json` as const;
}

export function generationUiMessageChunksPath(generationId: GenerationId) {
	return `generations/${generationId}/ui-message-chunks.jsonl` as const;
}
