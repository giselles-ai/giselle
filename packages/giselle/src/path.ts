import type {
	AppId,
	GenerationId,
	TaskId,
	WorkspaceId,
} from "@giselles-ai/protocol";

export function taskGenerationIndexesPath(taskId: TaskId) {
	return `generations/byTask/${taskId}.json` as const;
}

export function generationUiMessageChunksPath(generationId: GenerationId) {
	return `generations/${generationId}/ui-message-chunks.jsonl` as const;
}

export function appPath(appId: AppId) {
	return `apps/${appId}.json` as const;
}

export function taskPath(taskId: TaskId) {
	return `tasks/${taskId}.json`;
}

export function workspaceTaskPath(workspaceId: WorkspaceId) {
	return `tasks/byWorkspace/${workspaceId}.json`;
}
