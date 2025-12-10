import { type GiselleLogger, noopLogger } from "@giselles-ai/logger";
import {
	type FetchingWebPage,
	type FileId,
	type Generation,
	GenerationId,
	type GenerationOrigin,
	type GitHubEventData,
	type NodeId,
	type QueuedGeneration,
	type RunningGeneration,
	type SecretId,
	TaskId,
	type Trigger,
	type TriggerId,
	type Workspace,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import { getApp, saveApp } from "./apps";
import { deleteApp } from "./apps/delete-app";
import { getLanguageModelProviders } from "./configurations/get-language-model-providers";
import { copyFile, getFileText, removeFile, uploadFile } from "./files";
import {
	cancelGeneration,
	type GenerationMetadata,
	generateContent,
	generateImage,
	getGeneratedImage,
	getGeneration,
	getGenerationMessageChunkss,
	getNodeGenerations,
	type OnGenerationComplete,
	type OnGenerationError,
	setGeneration,
} from "./generations";
import { getTaskGenerationIndexes } from "./generations/get-task-generation-indexes";
import { flushGenerationIndexQueue } from "./generations/internal/task-generation-index-queue";
import { startContentGeneration } from "./generations/start-content-generation";
import {
	getGitHubRepositories,
	getGitHubRepositoryFullname,
	handleGitHubWebhookV2,
} from "./github";
import { executeAction } from "./operations";
import { executeQuery } from "./operations/execute-query";
import { addSecret, deleteSecret, getWorkspaceSecrets } from "./secrets";
import { addWebPage } from "./sources";
import {
	type CreateAndStartTaskInputs,
	type CreateTaskInputs,
	createAndStartTask,
	createTask,
	getTask,
	getWorkspaceInprogressTask,
	getWorkspaceTasks,
	type OnTaskCreate,
	type Patch,
	patchTask,
	type RunTaskInputs,
	runTask,
	type StartTaskInputs,
	startTask,
	streamTask,
} from "./tasks";
import {
	type ConfigureTriggerInput,
	configureTrigger,
	deleteTrigger,
	getTrigger,
	reconfigureGitHubTrigger,
	resolveTrigger,
	setTrigger,
} from "./triggers";
import type {
	GiselleConfig,
	GiselleContext,
	SetRunTaskProcessArgs,
	WaitUntil,
} from "./types";
import { bindGiselleFunction } from "./utils/create-giselle-function";
import {
	copyWorkspace,
	createSampleWorkspaces,
	createWorkspace,
	getWorkspace,
	updateWorkspace,
} from "./workspaces";

export * from "./error";
export type * from "./generations";
export * from "./integrations";
export * from "./tasks";
export * from "./telemetry";
export * from "./triggers";

const defaultWaitUntil: WaitUntil = (promise) => {
	return promise;
};

export function Giselle(config: GiselleConfig) {
	const context: GiselleContext = {
		...config,
		llmProviders: config.llmProviders ?? [],
		integrationConfigs: config.integrationConfigs ?? {},
		callbacks: config.callbacks,
		logger: config.logger ?? noopLogger,
		waitUntil: config.waitUntil ?? defaultWaitUntil,
		generateContentProcess: { type: "self" },
		runTaskProcess: { type: "self" },
		experimental_contentGenerationNode:
			config.experimental_contentGenerationNode ?? false,
	};
	return {
		updateContext: (updates: Partial<GiselleContext>): void => {
			Object.assign(context, updates);
		},
		getContext: (): GiselleContext => context,
		copyWorkspace: async (workspaceId: WorkspaceId, name?: string) => {
			return await copyWorkspace({
				context,
				workspaceId,
				name,
			});
		},
		createWorkspace: async () => {
			return await createWorkspace({ context });
		},
		getWorkspace: async (workspaceId: WorkspaceId) => {
			return await getWorkspace({
				context,
				workspaceId,
			});
		},
		updateWorkspace: async (workspace: Workspace) => {
			return await updateWorkspace({
				context,
				workspace,
			});
		},
		getLanguageModelProviders: () => getLanguageModelProviders({ context }),
		getGeneration: async (generationId: GenerationId) => {
			return await getGeneration({
				context,
				generationId,
			});
		},
		getNodeGenerations: async (origin: GenerationOrigin, nodeId: NodeId) => {
			return await getNodeGenerations({
				context,
				origin,
				nodeId,
			});
		},
		cancelGeneration: async (generationId: GenerationId) => {
			return await cancelGeneration({
				context,
				generationId,
			});
		},
		copyFile: async (
			workspaceId: WorkspaceId,
			sourceFileId: FileId,
			destinationFileId: FileId,
		) => {
			return await copyFile({
				storage: context.storage,
				workspaceId,
				sourceFileId,
				destinationFileId,
			});
		},
		uploadFile: async (
			file: File,
			workspaceId: WorkspaceId,
			fileId: FileId,
			fileName: string,
		) => {
			return await uploadFile({
				storage: context.storage,
				file,
				workspaceId,
				fileId,
				fileName,
			});
		},
		removeFile: async (workspaceId: WorkspaceId, fileId: FileId) => {
			return await removeFile({
				storage: context.storage,
				workspaceId,
				fileId,
			});
		},
		generateImage: async (
			generation: QueuedGeneration,
			signal?: AbortSignal,
		) => {
			return await generateImage({
				context,
				generation,
				signal,
			});
		},
		getGeneratedImage: async (generationId: GenerationId, filename: string) => {
			return await getGeneratedImage({
				context,
				generationId,
				filename,
			});
		},
		setGeneration: async (generation: Generation) => {
			return await setGeneration({
				context,
				generation,
			});
		},
		createSampleWorkspaces: async () => {
			return await createSampleWorkspaces({ context });
		},
		getGitHubRepositories: async () => {
			return await getGitHubRepositories({ context });
		},
		encryptSecret: async (plaintext: string) => {
			if (context.vault === undefined) {
				console.warn("Vault is not set");
				return plaintext;
			}
			return await context.vault.encrypt(plaintext);
		},
		resolveTrigger: async (args: { generation: QueuedGeneration }) => {
			return await resolveTrigger({ ...args, context });
		},
		configureTrigger: async (args: { trigger: ConfigureTriggerInput }) => {
			return await configureTrigger({ ...args, context });
		},
		getTrigger: async (args: { triggerId: TriggerId }) => {
			return await getTrigger({ ...args, context });
		},
		getGitHubRepositoryFullname: async (args: {
			repositoryNodeId: string;
			installationId: number;
		}) => {
			return await getGitHubRepositoryFullname({ ...args, context });
		},
		setTrigger: async (args: { trigger: Trigger }) =>
			setTrigger({ ...args, context }),
		reconfigureGitHubTrigger: async (args: {
			triggerId: TriggerId;
			repositoryNodeId: string;
			installationId: number;
			event?: GitHubEventData;
		}) => {
			return await reconfigureGitHubTrigger({ ...args, context });
		},
		deleteTrigger: async (args: { triggerId: TriggerId }) =>
			deleteTrigger({ ...args, context }),
		executeAction: async (args: { generation: QueuedGeneration }) =>
			executeAction({ ...args, context }),
		createAndStartTask: async (
			args: CreateAndStartTaskInputs & {
				onGenerationComplete?: OnGenerationComplete;
				onGenerationError?: OnGenerationError;
			},
		) =>
			createAndStartTask({
				...args,
				callbacks: {
					...args.callbacks,
					generationComplete:
						args.onGenerationComplete ?? config.callbacks?.generationComplete,
					generationError:
						args.onGenerationError ?? config.callbacks?.generationError,
				},
				context,
			}),
		startTask: async (
			args: StartTaskInputs & {
				onGenerationComplete?: OnGenerationComplete;
				onGenerationError?: OnGenerationError;
			},
		) =>
			startTask({
				...args,
				onGenerationComplete:
					args.onGenerationComplete ?? config.callbacks?.generationComplete,
				onGenerationError:
					args.onGenerationError ?? config.callbacks?.generationError,
				context,
			}),
		handleGitHubWebhookV2: async (args: {
			request: Request;
			onGenerationComplete?: OnGenerationComplete;
			onGenerationError?: OnGenerationError;
		}) => handleGitHubWebhookV2({ ...args, context }),
		executeQuery: async (generation: QueuedGeneration) =>
			executeQuery({ context, generation }),
		addWebPage: async (args: {
			workspaceId: WorkspaceId;
			webpage: FetchingWebPage;
		}) => addWebPage({ ...args, context }),
		async getFileText(args: { workspaceId: WorkspaceId; fileId: FileId }) {
			return await getFileText({
				storage: context.storage,
				workspaceId: args.workspaceId,
				fileId: args.fileId,
			});
		},
		async addSecret(args: {
			workspaceId: WorkspaceId;
			label: string;
			value: string;
			tags?: string[];
		}) {
			return await addSecret({ ...args, context });
		},
		async getWorkspaceSecrets(args: {
			workspaceId: WorkspaceId;
			tags?: string[];
		}) {
			return await getWorkspaceSecrets({ ...args, context });
		},
		async createTask(
			args: CreateTaskInputs & {
				onCreate?: OnTaskCreate;
			},
		) {
			return await createTask({
				...args,
				onCreate: args.onCreate ?? config.callbacks?.taskCreate,
				context,
			});
		},
		patchTask(args: { taskId: TaskId; patches: Patch[] }) {
			return patchTask({ ...args, context });
		},
		getWorkspaceTasks(args: { workspaceId: WorkspaceId }) {
			return getWorkspaceTasks({ ...args, context });
		},
		getTask(args: { taskId: TaskId }) {
			return getTask({ ...args, context });
		},
		streamTask(args: { taskId: TaskId }) {
			return streamTask({ ...args, context });
		},
		deleteSecret(args: { workspaceId: WorkspaceId; secretId: SecretId }) {
			return deleteSecret({ ...args, context });
		},
		async flushGenerationIndexQueue() {
			return await flushGenerationIndexQueue({ context });
		},
		generateContent(args: {
			generation: RunningGeneration;
			logger?: GiselleLogger;
			metadata?: GenerationMetadata;
			onComplete?: OnGenerationComplete;
			onError?: OnGenerationError;
		}) {
			return generateContent({
				...args,
				onComplete: args.onComplete ?? config.callbacks?.generationComplete,
				onError: args.onError ?? config.callbacks?.generationError,
				context: {
					...context,
					logger: args.logger ?? context.logger,
				},
			});
		},
		getGenerationMessageChunks(args: {
			generationId: GenerationId;
			startByte?: number;
			abortSignal?: AbortSignal;
		}) {
			return getGenerationMessageChunkss({ ...args, context });
		},
		startContentGeneration(args: {
			generation: Generation;
			onComplete?: OnGenerationComplete;
			onError?: OnGenerationError;
		}) {
			return startContentGeneration({
				...args,
				onComplete: args.onComplete ?? config.callbacks?.generationComplete,
				onError: args.onError ?? config.callbacks?.generationError,
				context,
			});
		},
		setGenerateContentProcess(
			process: (args: {
				context: GiselleContext;
				generation: RunningGeneration;
				metadata?: GenerationMetadata;
			}) => Promise<void>,
		) {
			context.generateContentProcess = { type: "external", process };
		},
		getWorkspaceInprogressTask(args: { workspaceId: WorkspaceId }) {
			return getWorkspaceInprogressTask({ ...args, context });
		},
		getTaskGenerationIndexes(args: { taskId: TaskId }) {
			return getTaskGenerationIndexes({ ...args, context });
		},
		setRunTaskProcess(process: (args: SetRunTaskProcessArgs) => Promise<void>) {
			context.runTaskProcess = { type: "external", process };
		},
		runTask(
			args: RunTaskInputs & {
				onGenerationComplete?: OnGenerationComplete;
				onGenerationError?: OnGenerationError;
			},
		) {
			return runTask({
				...args,
				onGenerationComplete:
					args.onGenerationComplete ?? config.callbacks?.generationComplete,
				onGenerationError:
					args.onGenerationError ?? config.callbacks?.generationError,
				context,
			});
		},
		saveApp: bindGiselleFunction(saveApp, context),
		deleteApp: bindGiselleFunction(deleteApp, context),
		getApp: bindGiselleFunction(getApp, context),
	};
}

export type Giselle = ReturnType<typeof Giselle>;

// Re-export value constructors explicitly
export { TaskId, GenerationId };
export * from "./error";
