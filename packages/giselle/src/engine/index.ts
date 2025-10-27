import type {
	FetchingWebPage,
	FileId,
	FlowTrigger,
	FlowTriggerId,
	GitHubFlowTriggerEvent,
	NodeId,
	SecretId,
	Workspace,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import { ActId, GenerationId } from "../concepts/identifiers";
import { noopLogger } from "../logger/noop-logger";
import type { GiselleLogger } from "../logger/types";
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
import { getLanguageModelProviders } from "./configurations/get-language-model-providers";
import { copyFile, getFileText, removeFile, uploadFile } from "./files";
import {
	cancelGeneration,
	type Generation,
	type GenerationMetadata,
	type GenerationOrigin,
	generateContent,
	generateImage,
	generateText,
	getGeneratedImage,
	getGeneration,
	getGenerationMessageChunkss,
	getNodeGenerations,
	type QueuedGeneration,
	type RunningGeneration,
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
	getTriggerProviders,
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
import {
	copyWorkspace,
	createSampleWorkspaces,
	createWorkspace,
	getWorkspace,
	updateWorkspace,
} from "./workspaces";

export * from "../concepts/act";
export * from "../concepts/generation";
export * from "../concepts/identifiers";
export type * from "./acts";
export * from "./acts";
export * from "./experimental_storage";
export * from "./integrations";
export * from "./telemetry";
export type * from "./triggers";
export * from "./types";
export * from "./usage-limits";
export * from "./vault";
export * from "./vector-store";

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
		copyWorkspace: async (
			workspaceId: WorkspaceId,
			name?: string,
			useExperimentalStorage?: boolean,
		) => {
			return await copyWorkspace({
				context,
				workspaceId,
				name,
				useExperimentalStorage: useExperimentalStorage ?? false,
			});
		},
		createWorkspace: async ({
			useExperimentalStorage,
		}: {
			useExperimentalStorage: boolean;
		}) => {
			return await createWorkspace({ context, useExperimentalStorage });
		},
		getWorkspace: async (
			workspaceId: WorkspaceId,
			useExperimentalStorage: boolean,
		) => {
			return await getWorkspace({
				context,
				workspaceId,
				useExperimentalStorage,
			});
		},
		updateWorkspace: async (
			workspace: Workspace,
			useExperimentalStorage: boolean,
		) => {
			return await updateWorkspace({
				context,
				workspace,
				useExperimentalStorage,
			});
		},
		getLanguageModelProviders: () => getLanguageModelProviders({ context }),
		getTriggerProviders: () => getTriggerProviders({ context }),
		generateText: async (
			generation: QueuedGeneration,
			useExperimentalStorage: boolean,
			useAiGateway: boolean,
			useResumableGeneration: boolean,
		) => {
			return await generateText({
				context,
				generation,
				useExperimentalStorage,
				useAiGateway,
				useResumableGeneration,
			});
		},
		getGeneration: async (
			generationId: GenerationId,
			useExperimentalStorage: boolean,
		) => {
			return await getGeneration({
				context,
				generationId,
				useExperimentalStorage,
			});
		},
		getNodeGenerations: async (
			origin: GenerationOrigin,
			nodeId: NodeId,
			useExperimentalStorage: boolean,
		) => {
			return await getNodeGenerations({
				context,
				origin,
				nodeId,
				useExperimentalStorage,
			});
		},
		cancelGeneration: async (
			generationId: GenerationId,
			useExperimentalStorage: boolean,
		) => {
			return await cancelGeneration({
				context,
				generationId,
				useExperimentalStorage,
			});
		},
		copyFile: async (
			workspaceId: WorkspaceId,
			sourceFileId: FileId,
			destinationFileId: FileId,
			useExperimentalStorage: boolean,
		) => {
			return await copyFile({
				deprecated_storage: context.deprecated_storage,
				storage: context.storage,
				workspaceId,
				sourceFileId,
				destinationFileId,
				useExperimentalStorage,
			});
		},
		uploadFile: async (
			file: File,
			workspaceId: WorkspaceId,
			fileId: FileId,
			fileName: string,
			useExperimentalStorage: boolean,
		) => {
			return await uploadFile({
				deprecated_storage: context.deprecated_storage,
				storage: context.storage,
				useExperimentalStorage,
				file,
				workspaceId,
				fileId,
				fileName,
			});
		},
		removeFile: async (
			workspaceId: WorkspaceId,
			fileId: FileId,
			useExperimentalStorage: boolean,
		) => {
			return await removeFile({
				deprecated_storage: context.deprecated_storage,
				storage: context.storage,
				workspaceId,
				fileId,
				useExperimentalStorage,
			});
		},
		generateImage: async (
			generation: QueuedGeneration,
			useExperimentalStorage: boolean,
			signal?: AbortSignal,
		) => {
			return await generateImage({
				context,
				generation,
				useExperimentalStorage,
				signal,
			});
		},
		getGeneratedImage: async (
			generationId: GenerationId,
			filename: string,
			useExperimentalStorage: boolean,
		) => {
			return await getGeneratedImage({
				context,
				generationId,
				filename,
				useExperimentalStorage,
			});
		},
		setGeneration: async (
			generation: Generation,
			useExperimentalStorage: boolean,
		) => {
			return await setGeneration({
				context,
				generation,
				useExperimentalStorage,
			});
		},
		createSampleWorkspaces: async (useExperimentalStorage: boolean) => {
			return await createSampleWorkspaces({ context, useExperimentalStorage });
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
		resolveTrigger: async (args: {
			generation: QueuedGeneration;
			useExperimentalStorage: boolean;
		}) => {
			return await resolveTrigger({ ...args, context });
		},
		configureTrigger: async (args: {
			trigger: ConfigureTriggerInput;
			useExperimentalStorage: boolean;
		}) => {
			return await configureTrigger({ ...args, context });
		},
		getTrigger: async (args: {
			flowTriggerId: FlowTriggerId;
			useExperimentalStorage?: boolean;
		}) => {
			return await getTrigger({ ...args, context });
		},
		getGitHubRepositoryFullname: async (args: {
			repositoryNodeId: string;
			installationId: number;
		}) => {
			return await getGitHubRepositoryFullname({ ...args, context });
		},
		setTrigger: async (args: {
			trigger: FlowTrigger;
			useExperimentalStorage?: boolean;
		}) => setTrigger({ ...args, context }),
		reconfigureGitHubTrigger: async (args: {
			flowTriggerId: FlowTriggerId;
			repositoryNodeId: string;
			installationId: number;
			useExperimentalStorage: boolean;
			event?: GitHubFlowTriggerEvent;
		}) => {
			return await reconfigureGitHubTrigger({ ...args, context });
		},
		deleteTrigger: async (args: {
			flowTriggerId: FlowTriggerId;
			useExperimentalStorage?: boolean;
		}) => deleteTrigger({ ...args, context }),
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
			useExperimentalStorage: boolean;
		}) => addWebPage({ ...args, context }),
		async getFileText(args: {
			workspaceId: WorkspaceId;
			fileId: FileId;
			useExperimentalStorage: boolean;
		}) {
			return await getFileText({
				deprecated_storage: context.deprecated_storage,
				storage: context.storage,
				workspaceId: args.workspaceId,
				fileId: args.fileId,
				useExperimentalStorage: args.useExperimentalStorage,
			});
		},
		async addSecret(args: {
			workspaceId: WorkspaceId;
			label: string;
			value: string;
			tags?: string[];
			useExperimentalStorage: boolean;
		}) {
			return await addSecret({ ...args, context });
		},
		async getWorkspaceSecrets(args: {
			workspaceId: WorkspaceId;
			tags?: string[];
			useExperimentalStorage: boolean;
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
		deleteSecret(args: {
			workspaceId: WorkspaceId;
			secretId: SecretId;
			useExperimentalStorage: boolean;
		}) {
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
	};
}

export type GiselleEngine = ReturnType<typeof GiselleEngine>;

// Re-export value constructors explicitly
export { ActId, GenerationId };
export * from "./error";
