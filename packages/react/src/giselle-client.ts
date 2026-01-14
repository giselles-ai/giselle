"use client";

import type { Giselle } from "@giselles-ai/giselle";
import type {
	FileId,
	Generation,
	GenerationId,
	GenerationOrigin,
	NodeGenerationIndex,
	NodeId,
	QueuedGeneration,
	SecretId,
	Task,
	Workspace,
	WorkspaceId,
} from "@giselles-ai/protocol";

export interface GiselleClient {
	// bootstrap (used in playground home)
	createWorkspace: Giselle["createWorkspace"];
	createSampleWorkspaces: Giselle["createSampleWorkspaces"];

	// workspaces
	getWorkspace(input: {
		workspaceId: WorkspaceId;
	}): ReturnType<Giselle["getWorkspace"]>;
	updateWorkspace(input: {
		workspace: Workspace;
	}): ReturnType<Giselle["updateWorkspace"]>;

	// apps
	getApp(
		input: Parameters<Giselle["getApp"]>[0],
	): Promise<{ app: Awaited<ReturnType<Giselle["getApp"]>> }>;
	saveApp(input: Parameters<Giselle["saveApp"]>[0]): Promise<void>;
	deleteApp(input: Parameters<Giselle["deleteApp"]>[0]): Promise<void>;

	// tasks
	createTask: Giselle["createTask"];
	startTask(input: Parameters<Giselle["startTask"]>[0]): Promise<void>;
	getWorkspaceInprogressTask(
		input: Parameters<Giselle["getWorkspaceInprogressTask"]>[0],
	): Promise<{ task: Task | undefined }>;
	getTaskGenerationIndexes(
		input: Parameters<Giselle["getTaskGenerationIndexes"]>[0],
	): Promise<{ task: Task; generationIndexes?: NodeGenerationIndex[] }>;
	getWorkspaceTasks(input: {
		workspaceId: WorkspaceId;
	}): Promise<{ tasks: Task[] }>;
	// streamTask omitted (not currently used in Studio editor UI)

	// generations
	getGeneration(input: {
		generationId: GenerationId;
	}): ReturnType<Giselle["getGeneration"]>;
	getNodeGenerations(input: {
		origin: GenerationOrigin;
		nodeId: NodeId;
	}): ReturnType<Giselle["getNodeGenerations"]>;
	cancelGeneration(input: {
		generationId: GenerationId;
	}): ReturnType<Giselle["cancelGeneration"]>;
	setGeneration(input: { generation: Generation }): Promise<void>;
	generateImage(input: { generation: QueuedGeneration }): Promise<void>;
	startContentGeneration(
		input: Parameters<Giselle["startContentGeneration"]>[0],
	): Promise<{
		generation: Awaited<ReturnType<Giselle["startContentGeneration"]>>;
	}>;
	getGenerationMessageChunks(
		input: Omit<
			Parameters<Giselle["getGenerationMessageChunks"]>[0],
			"abortSignal"
		>,
	): ReturnType<Giselle["getGenerationMessageChunks"]>;
	generateContent(
		input: Parameters<Giselle["generateContent"]>[0],
	): Promise<{ generation: Awaited<ReturnType<Giselle["generateContent"]>> }>;

	// triggers + ops
	resolveTrigger(
		input: Parameters<Giselle["resolveTrigger"]>[0],
	): Promise<{ trigger: Awaited<ReturnType<Giselle["resolveTrigger"]>> }>;
	configureTrigger(
		input: Parameters<Giselle["configureTrigger"]>[0],
	): Promise<{ triggerId: Awaited<ReturnType<Giselle["configureTrigger"]>> }>;
	getTrigger(
		input: Parameters<Giselle["getTrigger"]>[0],
	): Promise<{ trigger: Awaited<ReturnType<Giselle["getTrigger"]>> }>;
	setTrigger(
		input: Parameters<Giselle["setTrigger"]>[0],
	): Promise<{ triggerId: Awaited<ReturnType<Giselle["setTrigger"]>> }>;
	reconfigureGitHubTrigger(
		input: Parameters<Giselle["reconfigureGitHubTrigger"]>[0],
	): Promise<{
		triggerId: Awaited<ReturnType<Giselle["reconfigureGitHubTrigger"]>>;
	}>;
	executeAction(input: Parameters<Giselle["executeAction"]>[0]): Promise<void>;
	executeQuery(input: { generation: QueuedGeneration }): Promise<void>;
	getGitHubRepositoryFullname(
		input: Parameters<Giselle["getGitHubRepositoryFullname"]>[0],
	): Promise<{
		fullname: Awaited<ReturnType<Giselle["getGitHubRepositoryFullname"]>>;
	}>;

	// files
	uploadFile(formData: FormData): Promise<void>;
	removeFile(input: {
		workspaceId: WorkspaceId;
		fileId: FileId;
	}): Promise<void>;
	copyFile(input: {
		workspaceId: WorkspaceId;
		sourceFileId: FileId;
		destinationFileId: FileId;
	}): Promise<void>;
	getFileText(
		input: Parameters<Giselle["getFileText"]>[0],
	): Promise<{ text: Awaited<ReturnType<Giselle["getFileText"]>> }>;
	addWebPage(
		input: Parameters<Giselle["addWebPage"]>[0],
	): ReturnType<Giselle["addWebPage"]>;

	// secrets
	addSecret(
		input: Parameters<Giselle["addSecret"]>[0],
	): Promise<{ secret: Awaited<ReturnType<Giselle["addSecret"]>> }>;
	deleteSecret(input: { secretId: SecretId }): Promise<void>;
	getWorkspaceSecrets(
		input: Parameters<Giselle["getWorkspaceSecrets"]>[0],
	): Promise<{ secrets: Awaited<ReturnType<Giselle["getWorkspaceSecrets"]>> }>;
}
