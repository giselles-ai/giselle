import type {
	CreatedRun,
	FileId,
	Generation,
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
	getWorkspaceGitHubIntegrationSetting,
	handleWebhook,
	upsertGithubIntegrationSetting,
	urlToObjectID,
} from "./github";
import { addRun, runApi, startRun } from "./runs";
import type { GiselleEngineConfig, GiselleEngineContext } from "./types";
import { createWorkspace, getWorkspace, updateWorkspace } from "./workspaces";
export { HandleGitHubWebhookResult } from "./github";
export * from "./types";

export function GiselleEngine(config: GiselleEngineConfig) {
	const context: GiselleEngineContext = {
		storage: config.storage,
		llmProviders: config.llmProviders ?? [],
		integrationConfigs: config.integrationConfigs ?? [],
		onConsumeAgentTime: config.onConsumeAgentTime,
		telemetry: config.telemetry,
		fetchUsageLimitsFn: config.fetchUsageLimitsFn,
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

		githubUrlToObjectId: async (url: string) => {
			return await urlToObjectID({
				url,
				context,
			});
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
		generateImage: async (generation: QueuedGeneration) => {
			return await generateImage({
				context,
				generation,
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
	};
}

export type GiselleEngine = ReturnType<typeof GiselleEngine>;

export * from "./error";
