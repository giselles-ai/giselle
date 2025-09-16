import type { ActId, GenerationId } from "./identifiers";

export function actGenerationIndexesPath(actId: ActId) {
	return `generations/byAct/${actId}.json` as const;
}

export function generationUiMessagesPath(generationId: GenerationId) {
	return `generations/${generationId}/ui-messages.jsonl` as const;
}
