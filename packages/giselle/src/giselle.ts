import { type GiselleLogger, noopLogger } from "@giselles-ai/logger";
import {
	ActId,
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
	type Trigger,
	type TriggerId,
	type Workspace,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import {
	type CreateActInputs,
	type CreateAndStartActInputs,
	createAct,
	createAndStartAct,
	getAct,
	getWorkspaceActs,
	getWorkspaceInprogressAct,
	type Patch,
	patchAct,
	type RunActInputs,
	runAct,
	type StartActInputs,
	startAct,
	streamAct,
} from "./acts";
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
	setGeneration,
} from "./generations";
import { getActGenerationIndexes } from "./generations/get-act-generation-indexes";
import { flushGenerationIndexQueue } from "./generations/internal/act-generation-index-queue";
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
	type ConfigureTriggerInput,
	configureTrigger,
	deleteTrigger,
	getTrigger,
	reconfigureGitHubTrigger,
	resolveTrigger,
	setTrigger,
} from "./triggers";
import type {
	GiselleEngineConfig,
	GiselleEngineContext,
	SetRunActProcessArgs,
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

export * from "./acts";
export * from "./error";
export type * from "./generations";
export * from "./integrations";
export * from "./telemetry";
export type * from "./triggers";
export * from "./utils/workspace";
export * from "./vault";

const defaultWaitUntil: WaitUntil = (promise) => {
	return promise;
};

export function GiselleEngine(config: GiselleEngineConfig) {
	const context: GiselleEngineContext = {
		...config,
		llmProviders: config.llmProviders ?? [],
		integrationConfigs: config.integrationConfigs ?? {},
		callbacks: config.callbacks,
		logger: config.logger ?? noopLogger,
		waitUntil: config.waitUntil ?? defaultWaitUntil,
		generateContentProcess: { type: "self" },
		runActProcess: { type: "self" },
	};
	return {
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
		createAndStartAct: async (args: CreateAndStartActInputs) =>
			createAndStartAct({ ...args, context }),
		startAct: async (args: StartActInputs) => startAct({ ...args, context }),
		handleGitHubWebhookV2: async (args: { request: Request }) =>
			handleGitHubWebhookV2({ ...args, context }),
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
		async createAct(args: CreateActInputs) {
			return await createAct({
				...args,
				context,
			});
		},
		patchAct(args: { actId: ActId; patches: Patch[] }) {
			return patchAct({ ...args, context });
		},
		getWorkspaceActs(args: { workspaceId: WorkspaceId }) {
			return getWorkspaceActs({ ...args, context });
		},
		getAct(args: { actId: ActId }) {
			return getAct({ ...args, context });
		},
		streamAct(args: { actId: ActId }) {
			return streamAct({ ...args, context });
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
		}) {
			return generateContent({ ...args, context });
		},
		getGenerationMessageChunks(args: {
			generationId: GenerationId;
			startByte?: number;
			abortSignal?: AbortSignal;
		}) {
			return getGenerationMessageChunkss({ ...args, context });
		},
		startContentGeneration(args: { generation: Generation }) {
			return startContentGeneration({ ...args, context });
		},
		setGenerateContentProcess(
			process: (args: {
				context: GiselleEngineContext;
				generation: RunningGeneration;
				metadata?: GenerationMetadata;
			}) => Promise<void>,
		) {
			context.generateContentProcess = { type: "external", process };
		},
		getWorkspaceInprogressAct(args: { workspaceId: WorkspaceId }) {
			return getWorkspaceInprogressAct({ ...args, context });
		},
		getActGenerationIndexes(args: { actId: ActId }) {
			return getActGenerationIndexes({ ...args, context });
		},
		setRunActProcess(process: (args: SetRunActProcessArgs) => Promise<void>) {
			context.runActProcess = { type: "external", process };
		},
		runAct(args: RunActInputs) {
			return runAct({ ...args, context });
		},
		saveApp: bindGiselleFunction(saveApp, context),
		deleteApp: bindGiselleFunction(deleteApp, context),
		getApp: bindGiselleFunction(getApp, context),
	};
}

export type GiselleEngine = ReturnType<typeof GiselleEngine>;

// Re-export value constructors explicitly
export { ActId, GenerationId };
export * from "./error";
