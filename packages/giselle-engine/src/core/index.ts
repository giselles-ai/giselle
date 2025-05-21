import type {
	CreatedRun,
	FileId,
	FlowTrigger,
	FlowTriggerId,
	Generation,
	GenerationContextInput,
	GenerationId,
	GenerationOrigin,
	NodeId,
	OverrideNode,
	QueuedGeneration,
	RunId,
	WorkflowId,
	Workspace,
	WorkspaceGitHubIntegrationSetting,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import { getLanguageModelProviders } from "./configurations/get-language-model-providers";
import { removeFile, uploadFile } from "./files";
import {
	type ConfigureTriggerInput,
	configureTrigger,
	getTrigger,
	resolveTrigger,
	runFlow,
	setTrigger,
} from "./flows";
import {
	type TelemetrySettings,
	cancelGeneration,
	generateImage,
	generateText,
	getGeneratedImage,
	getGeneration,
	getNodeGenerations,
	setGeneration,
} from "./generations";
import {
	type HandleGitHubWebhookOptions,
	getGitHubRepositories,
	getGitHubRepositoryFullname,
	getWorkspaceGitHubIntegrationSetting,
	handleGitHubWebhookV2,
	handleWebhook,
	upsertGithubIntegrationSetting,
} from "./github";
import { executeAction } from "./operations";
import { executeQuery } from "./operations/execute-query";
import { addRun, runApi, startRun } from "./runs";
import type { GiselleEngineConfig, GiselleEngineContext } from "./types";
import {
	copyWorkspace,
	createSampleWorkspace,
	createWorkspace,
	getWorkspace,
	updateWorkspace,
} from "./workspaces";
export { HandleGitHubWebhookResult } from "./github";
export * from "./types";
export * from "./vault";

export function GiselleEngine(config: GiselleEngineConfig) {
	const context: GiselleEngineContext = {
		...config,
		llmProviders: config.llmProviders ?? [],
		integrationConfigs: config.integrationConfigs ?? {},
	};
	return {
		copyWorkspace: async (workspaceId: WorkspaceId) => {
			return await copyWorkspace({ context, workspaceId });
		},
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
		generateText: async (
			generation: QueuedGeneration,
			telemetry?: TelemetrySettings,
		) => {
			return await generateText({
				context,
				generation,
				telemetry,
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
			overrideNodes?: OverrideNode[],
		) => {
			return await addRun({
				context,
				workspaceId,
				workflowId,
				run,
				overrideNodes: overrideNodes || [],
			});
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
		removeFile: async (workspaceId: WorkspaceId, fileId: FileId) => {
			return await removeFile({ context, fileId, workspaceId });
		},
		upsertGithubIntegrationSetting: async (
			workspaceGitHubIntegrationSetting: WorkspaceGitHubIntegrationSetting,
		) => {
			upsertGithubIntegrationSetting({
				context,
				workspaceGitHubIntegrationSetting,
			});
		},
		getWorkspaceGitHubIntegrationSetting: async (workspaceId: WorkspaceId) => {
			return await getWorkspaceGitHubIntegrationSetting({
				context,
				workspaceId,
			});
		},
		runApi: async (args: {
			workspaceId: WorkspaceId;
			workflowId: WorkflowId;
			overrideNodes?: OverrideNode[];
		}) => {
			return await runApi({ ...args, context });
		},
		githubWebhook: async ({
			options,
			...args
		}: {
			event: string;
			delivery: string;
			payload: unknown;
			options?: HandleGitHubWebhookOptions;
		}) => {
			return await handleWebhook({ context, github: args, options });
		},
		generateImage: async (
			generation: QueuedGeneration,
			telemetry?: TelemetrySettings,
		) => {
			return await generateImage({
				context,
				generation,
				telemetry,
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
		}) => {
			return await resolveTrigger({ ...args, context });
		},
		configureTrigger: async (args: {
			trigger: ConfigureTriggerInput;
		}) => {
			return await configureTrigger({ ...args, context });
		},
		getTrigger: async (args: {
			flowTriggerId: FlowTriggerId;
		}) => {
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
		executeAction: async (args: {
			generation: QueuedGeneration;
		}) => executeAction({ ...args, context }),
		runFlow: async (args: {
			triggerId: FlowTriggerId;
			triggerInputs?: GenerationContextInput[];
		}) => runFlow({ ...args, context }),
		handleGitHubWebhookV2: async (args: { request: Request }) =>
			handleGitHubWebhookV2({ ...args, context }),
		executeQuery: async (args: {
			generation: QueuedGeneration;
		}) => executeQuery({ ...args, context }),
	};
}

export type GiselleEngine = ReturnType<typeof GiselleEngine>;

export * from "./error";
