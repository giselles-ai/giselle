import type {
	FetchingWebPage,
	FileId,
	FlowTrigger,
	FlowTriggerId,
	NodeId,
	SecretId,
	Workspace,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import {
	type CreateActInputs,
	type CreateAndStartActInputs,
	createAct,
	createAndStartAct,
	getAct,
	getWorkspaceActs,
	type Patch,
	patchAct,
	type StartActInputs,
	startAct,
} from "./acts";
import { getLanguageModelProviders } from "./configurations/get-language-model-providers";
import { createDataSource, getWorkspaceDataSources } from "./data-source";
import type { DataSourceProviderObject } from "./data-source/types/object";
import { copyFile, getFileText, removeFile, uploadFile } from "./files";
import {
	type ConfigureTriggerInput,
	configureTrigger,
	deleteTrigger,
	getTrigger,
	resolveTrigger,
	setTrigger,
} from "./flows";
import {
	cancelGeneration,
	type Generation,
	type GenerationOrigin,
	generateImage,
	generateText,
	getGeneratedImage,
	getGeneration,
	getNodeGenerations,
	type QueuedGeneration,
	setGeneration,
	type TelemetrySettings,
} from "./generations";
import {
	getGitHubRepositories,
	getGitHubRepositoryFullname,
	handleGitHubWebhookV2,
} from "./github";
import { executeAction } from "./operations";
import { executeQuery } from "./operations/execute-query";
import { addSecret, deleteSecret, getWorkspaceSecrets } from "./secrets";
import { addWebPage } from "./sources";
import type { GiselleEngineConfig, GiselleEngineContext } from "./types";
import {
	copyWorkspace,
	createSampleWorkspace,
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
export * from "./experimental_vector-store";
export * from "./integrations";
export * from "./telemetry";
export * from "./types";
export * from "./usage-limits";
export * from "./vault";
export * from "./vector-store";

export function GiselleEngine(config: GiselleEngineConfig) {
	const context: GiselleEngineContext = {
		...config,
		llmProviders: config.llmProviders ?? [],
		integrationConfigs: config.integrationConfigs ?? {},
		callbacks: config.callbacks,
	};
	return {
		copyWorkspace: async (workspaceId: WorkspaceId, name?: string) => {
			return await copyWorkspace({ context, workspaceId, name });
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
		getLanguageModelProviders: async () => {
			return await getLanguageModelProviders({ context });
		},
		generateText: async (
			generation: QueuedGeneration,
			useExperimentalStorage: boolean,
			telemetry?: TelemetrySettings,
		) => {
			return await generateText({
				context,
				generation,
				useExperimentalStorage,
				telemetry,
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
				storage: context.storage,
				experimental_storage: context.experimental_storage,
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
				storage: context.storage,
				experimental_storage: context.experimental_storage,
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
				storage: context.storage,
				experimental_storage: context.experimental_storage,
				workspaceId,
				fileId,
				useExperimentalStorage,
			});
		},
		generateImage: async (
			generation: QueuedGeneration,
			useExperimentalStorage: boolean,
			telemetry?: TelemetrySettings,
		) => {
			return await generateImage({
				context,
				generation,
				useExperimentalStorage,
				telemetry,
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
		createSampleWorkspace: async () => {
			return await createSampleWorkspace({ context });
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
		getTrigger: async (args: { flowTriggerId: FlowTriggerId }) => {
			return await getTrigger({ ...args, context });
		},
		getGitHubRepositoryFullname: async (args: {
			repositoryNodeId: string;
			installationId: number;
		}) => {
			return await getGitHubRepositoryFullname({ ...args, context });
		},
		setTrigger: async (args: { trigger: FlowTrigger }) =>
			setTrigger({ ...args, context }),
		deleteTrigger: async (args: { flowTriggerId: FlowTriggerId }) =>
			deleteTrigger({ ...args, context }),
		executeAction: async (args: { generation: QueuedGeneration }) =>
			executeAction({ ...args, context }),
		createAndStartAct: async (args: CreateAndStartActInputs) =>
			createAndStartAct({ ...args, context }),
		startAct: async (args: StartActInputs) => startAct({ ...args, context }),
		handleGitHubWebhookV2: async (args: { request: Request }) =>
			handleGitHubWebhookV2({ ...args, context }),
		executeQuery: async (
			generation: QueuedGeneration,
			telemetry?: TelemetrySettings,
		) => executeQuery({ context, generation, telemetry }),
		addWebPage: async (args: {
			workspaceId: WorkspaceId;
			webpage: FetchingWebPage;
		}) => addWebPage({ ...args, context }),
		async getFileText(args: {
			workspaceId: WorkspaceId;
			fileId: FileId;
			useExperimentalStorage: boolean;
		}) {
			return await getFileText({
				storage: context.storage,
				experimental_storage: context.experimental_storage,
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
		}) {
			return await addSecret({ ...args, context });
		},
		async getWorkspaceSecrets(args: {
			workspaceId: WorkspaceId;
			tags?: string[];
		}) {
			return await getWorkspaceSecrets({ ...args, context });
		},
		async createDataSource(args: {
			workspaceId: WorkspaceId;
			dataSource: DataSourceProviderObject;
		}) {
			return await createDataSource({ ...args, context });
		},
		async getWorkspaceDataSources(args: { workspaceId: WorkspaceId }) {
			return await getWorkspaceDataSources({ ...args, context });
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
		deleteSecret(args: { workspaceId: WorkspaceId; secretId: SecretId }) {
			return deleteSecret({ ...args, context });
		},
	};
}

export type GiselleEngine = ReturnType<typeof GiselleEngine>;

// Re-export value constructors explicitly
import { ActId, GenerationId } from "../concepts/identifiers";
export { ActId, GenerationId };

export * from "./error";
