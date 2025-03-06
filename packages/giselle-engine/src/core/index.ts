import type {
	CreatedRun,
	FileId,
	GenerationId,
	GenerationOrigin,
	NodeId,
	QueuedGeneration,
	RunId,
	WorkflowId,
	Workspace,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import { getLanguageModelProviders } from "./configurations/get-language-model-providers";
import { removeFile, uploadFile } from "./files";
import {
	cancelGeneration,
	generateText,
	getGeneration,
	getNodeGenerations,
} from "./generations";
import { addRun, startRun } from "./runs";
import type { GiselleEngineConfig, GiselleEngineContext } from "./types";
import { createWorkspace, getWorkspace, updateWorkspace } from "./workspaces";
export * from "./types";

export function GiselleEngine(config: GiselleEngineConfig) {
	const context: GiselleEngineContext = {
		storage: config.storage,
		llmProviders: config.llmProviders ?? [],
	};
	return {
		createWorkspace: async () => {
			return await createWorkspace({ context });
		},
		getWorkspace: async (workspaceId: WorkspaceId) => {
			return await getWorkspace({ context, workspaceId });
		},
		updateWorkspace: async (workspace: Workspace) => {
			return await updateWorkspace({ context, workspace });
		},
		getLanguageModelProviders: async () => {
			return await getLanguageModelProviders({ context });
		},
		generateText: async (generation: QueuedGeneration) => {
			return await generateText({
				context,
				generation,
			});
		},
		getGeneration: async (generationId: GenerationId) => {
			return await getGeneration({ context, generationId });
		},
		getNodeGenerations: async (origin: GenerationOrigin, nodeId: NodeId) => {
			return await getNodeGenerations({ context, origin, nodeId });
		},
		cancelGeneration: async (generationId: GenerationId) => {
			return await cancelGeneration({ context, generationId });
		},
		addRun: async (
			workspaceId: WorkspaceId,
			workflowId: WorkflowId,
			run: CreatedRun,
		) => {
			return await addRun({ context, workspaceId, workflowId, run });
		},
		startRun: async (runId: RunId) => {
			return await startRun({ context, runId });
		},
		uploadFile: async (
			file: File,
			workspaceId: WorkspaceId,
			fileId: FileId,
			fileName: string,
		) => {
			return await uploadFile({ context, file, workspaceId, fileId, fileName });
		},
		removeFile: async (
			workspaceId: WorkspaceId,
			fileId: FileId,
			fileName: string,
		) => {
			return await removeFile({ context, fileId, workspaceId, fileName });
		},
	};
}

export type GiselleEngine = ReturnType<typeof GiselleEngine>;
