import type { ActId, GenerationId } from "@giselles-ai/protocol";

export function actGenerationIndexesPath(actId: ActId) {
	return `generations/byAct/${actId}.json` as const;
}

export function generationUiMessageChunksPath(generationId: GenerationId) {
	return `generations/${generationId}/ui-message-chunks.jsonl` as const;
}
