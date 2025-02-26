import {
	CreatedGeneration,
	CreatedRun,
	FileId,
	Generation,
	GenerationId,
	GenerationOrigin,
	LLMProvider,
	NodeId,
	QueuedGeneration,
	QueuedRun,
	RunId,
	UploadedFileData,
	WorkflowId,
	Workspace,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import { z } from "zod";
import { Output as getWorkspaceOutput } from "../handlers/get-workspace";
import { Output as saveWorkspaceOutput } from "../handlers/save-workspace";

export const getWorkspace = {
	defaultApi: "/api/giselle/get-workspace",
	output: getWorkspaceOutput,
};

export const saveWorkspace = {
	defaultApi: "/api/giselle/save-workspace",
	output: saveWorkspaceOutput,
};

export const textGeneration = {
	Input: z.object({
		generationId: GenerationId.schema,
	}),
};

export const createOpenAIVectorStore = {
	defaultApi: "/api/giselle/create-openai-vector-store",
	Input: z.object({
		workspaceId: WorkspaceId.schema,
	}),
	Output: z.object({
		openaiVectorStoreId: z.string(),
	}),
};

export const deleteOpenAiVectorStore = {
	defaultApi: "/api/giselle/delete-openai-vector-store",
	Input: z.object({
		openAiVectorStoreId: z.string(),
	}),
};

export const uploadFile = {
	defaultApi: "/api/giselle/upload-file",
	Input: z.object({
		file: z.instanceof(File),
		workspaceId: WorkspaceId.schema,
		fileId: FileId.schema,
		fileName: z.string(),
	}),
	Output: z.object({
		generatedTitle: z.string(),
	}),
};

export const removeFile = {
	defaultApi: "/api/giselle/remove-file",
	Input: z.object({
		workspaceId: WorkspaceId.schema,
		uploadedFile: UploadedFileData,
	}),
};

export const runAssistant = {
	defaultApi: "/api/giselle/run-assistant",
	Input: z.object({
		workspaceId: WorkspaceId.schema,
		nodeId: NodeId.schema,
		message: z.string(),
	}),
};

export const getLLMProviders = {
	defaultApi: "/api/giselle/get-llm-providers",
	Output: z.object({ llmProviders: z.array(LLMProvider) }),
};

export const createWorkspace = {
	defaultApi: "/api/giselle/create-workspace",
	Output: z.object({
		workspace: Workspace,
	}),
};

export const addGeneration = {
	defaultApi: "/api/giselle/add-generation",
	Input: z.object({ generation: CreatedGeneration }),
	Output: z.object({
		generation: QueuedGeneration,
	}),
};

export const requestGeneration = {
	defaultApi: "/api/giselle/request-generation",
	Input: z.object({
		generationId: GenerationId.schema,
	}),
};

export const getGeneration = {
	defaultApi: "/api/giselle/get-generation",
	Input: z.object({
		generationId: GenerationId.schema,
	}),
	Output: z.object({
		generation: Generation,
	}),
};

export const addRun = {
	defaultApi: "/api/giselle/add-run",
	Input: z.object({
		workspaceId: WorkspaceId.schema,
		workflowId: WorkflowId.schema,
		run: CreatedRun,
	}),
	Output: z.object({
		run: QueuedRun,
	}),
};

export const startRun = {
	defaultApi: "/api/giselle/start-run",
	Input: z.object({
		runId: RunId.schema,
	}),
};

export const getNodeGenerations = {
	defaultApi: "/api/giselle/get-node-generations",
	Input: z.object({
		origin: GenerationOrigin,
		nodeId: NodeId.schema,
	}),
	Output: z.object({
		generations: z.array(Generation),
	}),
};

export const githubOperation = {
	defaultApi: "/api/giselle/github-operation",
	Input: z.object({
		generationId: GenerationId.schema,
	}),
};
