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
import { z } from "zod/v4";
import type { GiselleEngine } from "../core";
import { ConfigureTriggerInput } from "../core/flows";
import type { TelemetrySettings } from "../core/generations";
import { JsonResponse } from "../utils";
import { createHandler, withUsageLimitErrorHandler } from "./create-handler";

export const createJsonRouters = {
	createWorkspace: (giselleEngine: GiselleEngine) =>
		createHandler({
			handler: async () => {
				const workspace = await giselleEngine.createWorkspace();
				return JsonResponse.json(workspace);
			},
		}),
	getWorkspace: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({ workspaceId: WorkspaceId.schema }),
			handler: async ({ input }) => {
				const workspace = await giselleEngine.getWorkspace(input.workspaceId);
				return JsonResponse.json(workspace);
			},
		}),

	updateWorkspace: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspace: Workspace,
			}),
			handler: async ({ input }) => {
				const workspace = await giselleEngine.updateWorkspace(input.workspace);
				return JsonResponse.json(workspace);
			},
		}),
	getLanguageModelProviders: (giselleEngine: GiselleEngine) =>
		createHandler({
			handler: async () => {
				const providers = await giselleEngine.getLanguageModelProviders();
				return JsonResponse.json(providers);
			},
		}),
	generateText: (giselleEngine: GiselleEngine) =>
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
		),
	getGeneration: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({ generationId: GenerationId.schema }),
			handler: async ({ input }) => {
				const generation = await giselleEngine.getGeneration(
					input.generationId,
				);
				return JsonResponse.json(generation);
			},
		}),
	getNodeGenerations: (giselleEngine: GiselleEngine) =>
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
		}),
	cancelGeneration: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({ generationId: GenerationId.schema }),
			handler: async ({ input }) => {
				const generation = await giselleEngine.cancelGeneration(
					input.generationId,
				);
				return JsonResponse.json(generation);
			},
		}),

	addRun: (giselleEngine: GiselleEngine) =>
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
		}),
	startRun: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({ runId: RunId.schema }),
			handler: async ({ input }) => {
				await giselleEngine.startRun(input.runId);
				return new Response(null, { status: 202 });
			},
		}),
	removeFile: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				fileId: FileId.schema,
			}),
			handler: async ({ input }) => {
				await giselleEngine.removeFile(input.workspaceId, input.fileId);
				return new Response(null, { status: 204 });
			},
		}),
	upsertWorkspaceGitHubIntegrationSetting: (giselleEngine: GiselleEngine) =>
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
		}),
	getWorkspaceGitHubIntegrationSetting: (giselleEngine: GiselleEngine) =>
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
		}),
	runApi: (giselleEngine: GiselleEngine) =>
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
		),
	generateImage: (giselleEngine: GiselleEngine) =>
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
		),
	setGeneration: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({ generation: Generation }),
			handler: async ({ input }) => {
				await giselleEngine.setGeneration(input.generation);
				return new Response(null, { status: 204 });
			},
		}),
	createSampleWorkspace: (giselleEngine: GiselleEngine) =>
		createHandler({
			handler: async () => {
				const workspace = await giselleEngine.createSampleWorkspace();
				return JsonResponse.json(workspace);
			},
		}),
	getGitHubRepositories: (giselleEngine: GiselleEngine) =>
		createHandler({
			handler: async () => {
				const repositories = await giselleEngine.getGitHubRepositories();
				return JsonResponse.json(repositories);
			},
		}),
	encryptSecret: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({ plaintext: z.string() }),
			handler: async ({ input }) => {
				return JsonResponse.json({
					encrypted: await giselleEngine.encryptSecret(input.plaintext),
				});
			},
		}),
	resolveTrigger: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					trigger: await giselleEngine.resolveTrigger(input),
				});
			},
		}),
	configureTrigger: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				trigger: ConfigureTriggerInput,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					triggerId: await giselleEngine.configureTrigger(input),
				});
			},
		}),
	getTrigger: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				flowTriggerId: FlowTriggerId.schema,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					trigger: await giselleEngine.getTrigger(input),
				});
			},
		}),
	getGitHubRepositoryFullname: (giselleEngine: GiselleEngine) =>
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
		}),
	setTrigger: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				trigger: FlowTrigger,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					triggerId: await giselleEngine.setTrigger(input),
				});
			},
		}),
	executeAction: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
			}),
			handler: async ({ input }) => {
				await giselleEngine.executeAction(input);
				return new Response(null, { status: 204 });
			},
		}),
	runFlow: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				triggerId: FlowTriggerId.schema,
				triggerInputs: z.array(GenerationContextInput).optional(),
			}),
			handler: async ({ input }) => {
				await giselleEngine.runFlow(input);
				return new Response(null, { status: 204 });
			},
		}),
	executeQuery: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
			}),
			handler: async ({ input }) => {
				await giselleEngine.executeQuery(input);
				return new Response(null, { status: 204 });
			},
		}),
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
) as JsonRouterPaths[];

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
