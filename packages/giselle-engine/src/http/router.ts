import {
	FetchingWebPage,
	FileId,
	FlowTrigger,
	FlowTriggerId,
	Generation,
	GenerationContextInput,
	GenerationId,
	GenerationOrigin,
	NodeId,
	QueuedGeneration,
	SecretId,
	Workspace,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import { z } from "zod/v4";
import type { GiselleEngine } from "../core";
import { DataSourceProviderObject } from "../core/data-source";
import { ConfigureTriggerInput, type PatchDelta } from "../core/flows";
import { FlowRunId } from "../core/flows/run/object";
import type { TelemetrySettings } from "../core/generations";
import { JsonResponse } from "../utils";
import { createHandler, withUsageLimitErrorHandler } from "./create-handler";

export const createJsonRouters = {
	createWorkspace: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				const workspace = await giselleEngine.createWorkspace(input);
				return JsonResponse.json(workspace);
			},
		}),
	getWorkspace: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				const workspace = await giselleEngine.getWorkspace(
					input.workspaceId,
					input.useExperimentalStorage,
				);
				return JsonResponse.json(workspace);
			},
		}),

	updateWorkspace: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspace: Workspace,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				const workspace = await giselleEngine.updateWorkspace(
					input.workspace,
					input.useExperimentalStorage,
				);
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
					useExperimentalStorage: z.boolean(),
					telemetry: z.custom<TelemetrySettings>().optional(),
				}),
				handler: async ({ input }) => {
					const stream = await giselleEngine.generateText(
						input.generation,
						input.useExperimentalStorage,
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
			input: z.object({
				generationId: GenerationId.schema,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				const generation = await giselleEngine.getGeneration(
					input.generationId,
					input.useExperimentalStorage,
				);
				return JsonResponse.json(generation);
			},
		}),
	getNodeGenerations: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				origin: GenerationOrigin,
				nodeId: NodeId.schema,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				const generations = await giselleEngine.getNodeGenerations(
					input.origin,
					input.nodeId,
					input.useExperimentalStorage,
				);
				return JsonResponse.json(generations);
			},
		}),
	cancelGeneration: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generationId: GenerationId.schema,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				const generation = await giselleEngine.cancelGeneration(
					input.generationId,
					input.useExperimentalStorage,
				);
				return JsonResponse.json(generation);
			},
		}),
	removeFile: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				fileId: FileId.schema,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				await giselleEngine.removeFile(
					input.workspaceId,
					input.fileId,
					input.useExperimentalStorage,
				);
				return new Response(null, { status: 204 });
			},
		}),
	copyFile: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				sourceFileId: FileId.schema,
				destinationFileId: FileId.schema,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				await giselleEngine.copyFile(
					input.workspaceId,
					input.sourceFileId,
					input.destinationFileId,
					input.useExperimentalStorage,
				);

				return new Response(null, { status: 204 });
			},
		}),
	generateImage: (giselleEngine: GiselleEngine) =>
		withUsageLimitErrorHandler(
			createHandler({
				input: z.object({
					generation: QueuedGeneration,
					useExperimentalStorage: z.boolean(),
					telemetry: z.custom<TelemetrySettings>().optional(),
				}),
				handler: async ({ input }) => {
					await giselleEngine.generateImage(
						input.generation,
						input.useExperimentalStorage,
						input.telemetry,
					);
					return new Response(null, { status: 204 });
				},
			}),
		),
	setGeneration: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generation: Generation,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) => {
				await giselleEngine.setGeneration(
					input.generation,
					input.useExperimentalStorage,
				);
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
				useExperimentalStorage: z.boolean(),
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
				useExperimentalStorage: z.boolean(),
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
	deleteTrigger: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({ flowTriggerId: FlowTriggerId.schema }),
			handler: async ({ input }) => {
				await giselleEngine.deleteTrigger(input);
				return new Response(null, { status: 204 });
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
				useExperimentalStorage: z.boolean(),
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
				telemetry: z.custom<TelemetrySettings>().optional(),
			}),
			handler: async ({ input }) => {
				await giselleEngine.executeQuery(input.generation, input.telemetry);
				return new Response(null, { status: 204 });
			},
		}),
	addWebPage: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				webpage: FetchingWebPage,
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json(await giselleEngine.addWebPage(input)),
		}),
	getFileText: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				fileId: FileId.schema,
				useExperimentalStorage: z.boolean(),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					text: await giselleEngine.getFileText({
						workspaceId: input.workspaceId,
						fileId: input.fileId,
						useExperimentalStorage: input.useExperimentalStorage,
					}),
				}),
		}),
	addSecret: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				label: z.string(),
				value: z.string(),
				tags: z.array(z.string()).optional(),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					secret: await giselleEngine.addSecret(input),
				}),
		}),
	getWorkspaceSecrets: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				tags: z.array(z.string()).optional(),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					secrets: await giselleEngine.getWorkspaceSecrets(input),
				}),
		}),
	createDataSource: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				dataSource: DataSourceProviderObject,
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					dataSource: await giselleEngine.createDataSource(input),
				}),
		}),
	getWorkspaceDataSources: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					dataSources: await giselleEngine.getWorkspaceDataSources(input),
				}),
		}),
	createRun: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				jobsCount: z.number(),
				trigger: z.string(),
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					run: await giselleEngine.createRun(input),
				}),
		}),
	patchRun: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				flowRunId: FlowRunId.schema,
				delta: z.custom<PatchDelta>(),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					run: await giselleEngine.patchRun(input),
				}),
		}),
	getWorkspaceFlowRuns: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					runs: await giselleEngine.getWorkspaceFlowRuns(input),
				}),
		}),
	deleteSecret: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				secretId: SecretId.schema,
			}),
			handler: async ({ input }) => {
				await giselleEngine.deleteSecret(input);
				return new Response(null, { status: 204 });
			},
		}),
} as const;

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
				useExperimentalStorage: z.coerce.boolean(),
			}),
			handler: async ({ input }) => {
				await giselleEngine.uploadFile(
					input.file,
					input.workspaceId,
					input.fileId,
					input.fileName,
					input.useExperimentalStorage,
				);
				return new Response(null, { status: 202 });
			},
		}),
} as const;

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
