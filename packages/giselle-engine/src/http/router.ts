import {
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
import { z } from "zod";
import type { GiselleEngine } from "../core";
import { ConfigureTriggerInput } from "../core/flows";
import type { TelemetrySettings } from "../core/generations";
import { JsonResponse } from "../utils";
import { createHandler, withUsageLimitErrorHandler } from "./create-handler";

const createWorkspaceRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		handler: async () => {
			const workspace = await giselleEngine.createWorkspace();
			return JsonResponse.json(workspace);
		},
	});

const getWorkspaceRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({ workspaceId: WorkspaceId.schema }),
		handler: async ({ input }) => {
			const workspace = await giselleEngine.getWorkspace(input.workspaceId);
			return JsonResponse.json(workspace);
		},
	});

const updateWorkspaceRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			workspace: Workspace,
		}),
		handler: async ({ input }) => {
			const workspace = await giselleEngine.updateWorkspace(input.workspace);
			return JsonResponse.json(workspace);
		},
	});

const getLanguageModelProvidersRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		handler: async () => {
			const providers = await giselleEngine.getLanguageModelProviders();
			return JsonResponse.json(providers);
		},
	});

const generateTextRouter = (giselleEngine: GiselleEngine) =>
	withUsageLimitErrorHandler(
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
				telemetry: z.custom<TelemetrySettings>().optional(),
			}),
			handler: async ({ input }) => {
				const stream = await giselleEngine.generateText(
					input.generation,
					input.telemetry,
				);
				return stream.toDataStreamResponse({
					sendReasoning: true,
				});
			},
		}),
	);

const getGenerationRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({ generationId: GenerationId.schema }),
		handler: async ({ input }) => {
			const generation = await giselleEngine.getGeneration(input.generationId);
			return JsonResponse.json(generation);
		},
	});

const getNodeGenerationsRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			origin: GenerationOrigin,
			nodeId: NodeId.schema,
		}),
		handler: async ({ input }) => {
			const generations = await giselleEngine.getNodeGenerations(
				input.origin,
				input.nodeId,
			);
			return JsonResponse.json(generations);
		},
	});

const cancelGenerationRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({ generationId: GenerationId.schema }),
		handler: async ({ input }) => {
			const generation = await giselleEngine.cancelGeneration(
				input.generationId,
			);
			return JsonResponse.json(generation);
		},
	});

const addRunRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			workspaceId: WorkspaceId.schema,
			workflowId: WorkflowId.schema,
			run: CreatedRun,
			overrideNodes: z.array(OverrideNode).optional(),
		}),
		handler: async ({ input }) => {
			const run = await giselleEngine.addRun(
				input.workspaceId,
				input.workflowId,
				input.run,
				input.overrideNodes,
			);
			return JsonResponse.json(run);
		},
	});

const startRunRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({ runId: RunId.schema }),
		handler: async ({ input }) => {
			await giselleEngine.startRun(input.runId);
			return new Response(null, { status: 202 });
		},
	});

const removeFileRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			workspaceId: WorkspaceId.schema,
			fileId: FileId.schema,
		}),
		handler: async ({ input }) => {
			await giselleEngine.removeFile(input.workspaceId, input.fileId);
			return new Response(null, { status: 204 });
		},
	});

const upsertWorkspaceGitHubIntegrationSettingRouter = (
	giselleEngine: GiselleEngine,
) =>
	createHandler({
		input: z.object({
			workspaceGitHubIntegrationSetting: WorkspaceGitHubIntegrationSetting,
		}),
		handler: async ({ input }) => {
			await giselleEngine.upsertGithubIntegrationSetting(
				input.workspaceGitHubIntegrationSetting,
			);
			return new Response(null, { status: 204 });
		},
	});

const getWorkspaceGitHubIntegrationSettingRouter = (
	giselleEngine: GiselleEngine,
) =>
	createHandler({
		input: z.object({
			workspaceId: WorkspaceId.schema,
		}),
		handler: async ({ input }) => {
			const workspaceGitHubIntegrationSetting =
				await giselleEngine.getWorkspaceGitHubIntegrationSetting(
					input.workspaceId,
				);
			return JsonResponse.json({
				workspaceGitHubIntegrationSetting,
			});
		},
	});

const runApiRouter = (giselleEngine: GiselleEngine) =>
	withUsageLimitErrorHandler(
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				workflowId: WorkflowId.schema,
				overrideNodes: z.array(OverrideNode).optional(),
			}),
			handler: async ({ input }) => {
				const result = await giselleEngine.runApi(input);
				return new Response(result.join("\n"));
			},
		}),
	);

const generateImageRouter = (giselleEngine: GiselleEngine) =>
	withUsageLimitErrorHandler(
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
				telemetry: z.custom<TelemetrySettings>().optional(),
			}),
			handler: async ({ input }) => {
				await giselleEngine.generateImage(input.generation, input.telemetry);
				return new Response(null, { status: 204 });
			},
		}),
	);

const setGenerationRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({ generation: Generation }),
		handler: async ({ input }) => {
			await giselleEngine.setGeneration(input.generation);
			return new Response(null, { status: 204 });
		},
	});

const createSampleWorkspaceRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		handler: async () => {
			const workspace = await giselleEngine.createSampleWorkspace();
			return JsonResponse.json(workspace);
		},
	});

const getGitHubRepositoriesRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		handler: async () => {
			const repositories = await giselleEngine.getGitHubRepositories();
			return JsonResponse.json(repositories);
		},
	});

const encryptSecretRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({ plaintext: z.string() }),
		handler: async ({ input }) => {
			return JsonResponse.json({
				encrypted: await giselleEngine.encryptSecret(input.plaintext),
			});
		},
	});

const resolveTriggerRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			generation: QueuedGeneration,
		}),
		handler: async ({ input }) => {
			return JsonResponse.json({
				trigger: await giselleEngine.resolveTrigger(input),
			});
		},
	});

const configureTriggerRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			trigger: ConfigureTriggerInput,
		}),
		handler: async ({ input }) => {
			return JsonResponse.json({
				triggerId: await giselleEngine.configureTrigger(input),
			});
		},
	});

const getTriggerRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			flowTriggerId: FlowTriggerId.schema,
		}),
		handler: async ({ input }) => {
			return JsonResponse.json({
				trigger: await giselleEngine.getTrigger(input),
			});
		},
	});

const getGitHubRepositoryFullnameRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			repositoryNodeId: z.string(),
			installationId: z.number(),
		}),
		handler: async ({ input }) => {
			return JsonResponse.json({
				fullname: await giselleEngine.getGitHubRepositoryFullname(input),
			});
		},
	});

const setTriggerRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			trigger: FlowTrigger,
		}),
		handler: async ({ input }) => {
			return JsonResponse.json({
				triggerId: await giselleEngine.setTrigger(input),
			});
		},
	});

const executeActionRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			generation: QueuedGeneration,
		}),
		handler: async ({ input }) => {
			await giselleEngine.executeAction(input);
			return new Response(null, { status: 204 });
		},
	});

const runFlowRouter = (giselleEngine: GiselleEngine) =>
	createHandler({
		input: z.object({
			triggerId: FlowTriggerId.schema,
			triggerInputs: z.array(GenerationContextInput).optional(),
		}),
		handler: async ({ input }) => {
			await giselleEngine.runFlow(input);
			return new Response(null, { status: 204 });
		},
	});

// Type definitions for each router function
type CreateWorkspaceType = typeof createWorkspaceRouter;
type GetWorkspaceType = typeof getWorkspaceRouter;
type UpdateWorkspaceType = typeof updateWorkspaceRouter;
type GetLanguageModelProvidersType = typeof getLanguageModelProvidersRouter;
type GenerateTextType = typeof generateTextRouter;
type GetGenerationType = typeof getGenerationRouter;
type GetNodeGenerationsType = typeof getNodeGenerationsRouter;
type CancelGenerationType = typeof cancelGenerationRouter;
type AddRunType = typeof addRunRouter;
type StartRunType = typeof startRunRouter;
type RemoveFileType = typeof removeFileRouter;
type UpsertWorkspaceGitHubIntegrationSettingType =
	typeof upsertWorkspaceGitHubIntegrationSettingRouter;
type GetWorkspaceGitHubIntegrationSettingType =
	typeof getWorkspaceGitHubIntegrationSettingRouter;
type RunApiType = typeof runApiRouter;
type GenerateImageType = typeof generateImageRouter;
type SetGenerationType = typeof setGenerationRouter;
type CreateSampleWorkspaceType = typeof createSampleWorkspaceRouter;
type GetGitHubRepositoriesType = typeof getGitHubRepositoriesRouter;
type EncryptSecretType = typeof encryptSecretRouter;
type ResolveTriggerType = typeof resolveTriggerRouter;
type ConfigureTriggerType = typeof configureTriggerRouter;
type GetTriggerType = typeof getTriggerRouter;
type GetGitHubRepositoryFullnameType = typeof getGitHubRepositoryFullnameRouter;
type SetTriggerType = typeof setTriggerRouter;
type ExecuteActionType = typeof executeActionRouter;
type RunFlowType = typeof runFlowRouter;

// Interface defining the complete router structure
interface CreateJsonRoutersType {
	createWorkspace: CreateWorkspaceType;
	getWorkspace: GetWorkspaceType;
	updateWorkspace: UpdateWorkspaceType;
	getLanguageModelProviders: GetLanguageModelProvidersType;
	generateText: GenerateTextType;
	getGeneration: GetGenerationType;
	getNodeGenerations: GetNodeGenerationsType;
	cancelGeneration: CancelGenerationType;
	addRun: AddRunType;
	startRun: StartRunType;
	removeFile: RemoveFileType;
	upsertWorkspaceGitHubIntegrationSetting: UpsertWorkspaceGitHubIntegrationSettingType;
	getWorkspaceGitHubIntegrationSetting: GetWorkspaceGitHubIntegrationSettingType;
	runApi: RunApiType;
	generateImage: GenerateImageType;
	setGeneration: SetGenerationType;
	createSampleWorkspace: CreateSampleWorkspaceType;
	getGitHubRepositories: GetGitHubRepositoriesType;
	encryptSecret: EncryptSecretType;
	resolveTrigger: ResolveTriggerType;
	configureTrigger: ConfigureTriggerType;
	getTrigger: GetTriggerType;
	getGitHubRepositoryFullname: GetGitHubRepositoryFullnameType;
	setTrigger: SetTriggerType;
	executeAction: ExecuteActionType;
	runFlow: RunFlowType;
}

export const createJsonRouters: CreateJsonRoutersType = {
	createWorkspace: createWorkspaceRouter,
	getWorkspace: getWorkspaceRouter,
	updateWorkspace: updateWorkspaceRouter,
	getLanguageModelProviders: getLanguageModelProvidersRouter,
	generateText: generateTextRouter,
	getGeneration: getGenerationRouter,
	getNodeGenerations: getNodeGenerationsRouter,
	cancelGeneration: cancelGenerationRouter,
	addRun: addRunRouter,
	startRun: startRunRouter,
	removeFile: removeFileRouter,
	upsertWorkspaceGitHubIntegrationSetting:
		upsertWorkspaceGitHubIntegrationSettingRouter,
	getWorkspaceGitHubIntegrationSetting:
		getWorkspaceGitHubIntegrationSettingRouter,
	runApi: runApiRouter,
	generateImage: generateImageRouter,
	setGeneration: setGenerationRouter,
	createSampleWorkspace: createSampleWorkspaceRouter,
	getGitHubRepositories: getGitHubRepositoriesRouter,
	encryptSecret: encryptSecretRouter,
	resolveTrigger: resolveTriggerRouter,
	configureTrigger: configureTriggerRouter,
	getTrigger: getTriggerRouter,
	getGitHubRepositoryFullname: getGitHubRepositoryFullnameRouter,
	setTrigger: setTriggerRouter,
	executeAction: executeActionRouter,
	runFlow: runFlowRouter,
} as const;

export const jsonRouterPaths = Object.keys(
	createJsonRouters,
) as JsonRouterPaths[];

// Export the types at module level
export type JsonRouterPaths = keyof typeof createJsonRouters;
export type JsonRouterHandlers = {
	[P in JsonRouterPaths]: ReturnType<(typeof createJsonRouters)[P]>;
};
export type JsonRouterInput = {
	[P in JsonRouterPaths]: Parameters<JsonRouterHandlers[P]>[0]["input"];
};
export function isJsonRouterPath(path: string): path is JsonRouterPaths {
	return path in createJsonRouters;
}

export const createFormDataRouters = {
	uploadFile: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				fileId: FileId.schema,
				fileName: z.string(),
				file: z.instanceof(File),
			}),
			handler: async ({ input }) => {
				await giselleEngine.uploadFile(
					input.file,
					input.workspaceId,
					input.fileId,
					input.fileName,
				);
				return new Response(null, { status: 202 });
			},
		}),
} as const;

export const formDataRouterPaths = Object.keys(
	createFormDataRouters,
) as FormDataRouterPaths[];

// Export the types at module level
export type FormDataRouterPaths = keyof typeof createFormDataRouters;
export type FormDataRouterHandlers = {
	[P in FormDataRouterPaths]: ReturnType<(typeof createFormDataRouters)[P]>;
};
export type FormDataRouterInput = {
	[P in FormDataRouterPaths]: Parameters<FormDataRouterHandlers[P]>[0]["input"];
};
export function isFormDataRouterPath(
	path: string,
): path is FormDataRouterPaths {
	return path in createFormDataRouters;
}
