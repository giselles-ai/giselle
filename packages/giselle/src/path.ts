import type { ActId, AppId, GenerationId } from "@giselles-ai/protocol";

export function actGenerationIndexesPath(actId: ActId) {
	return `generations/byAct/${actId}.json` as const;
}

export function generationUiMessageChunksPath(generationId: GenerationId) {
	return `generations/${generationId}/ui-message-chunks.jsonl` as const;
}

export function appPath(appId: AppId) {
	return `apps/${appId}.json` as const;
}
