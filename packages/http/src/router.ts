import {
	ConfigureTriggerInput,
	CreateAndStartTaskInputs,
	CreateTaskInputs,
	type Giselle,
	type Patch,
	StartTaskInputs,
} from "@giselles-ai/giselle";
import {
	DataStore,
	DataStoreId,
	FetchingWebPage,
	FileId,
	Generation,
	GenerationId,
	GenerationOrigin,
	GitHubEventData,
	NodeId,
	QueuedGeneration,
	RunningGeneration,
	SecretId,
	TaskId,
	Trigger,
	TriggerId,
	Workspace,
	WorkspaceId,
} from "@giselles-ai/protocol";
import * as z from "zod/v4";
import { createHandler, withUsageLimitErrorHandler } from "./create-handler";
import { JsonResponse } from "./json-response";

export const jsonRoutes = {
	createWorkspace: (giselle: Giselle) =>
		createHandler({
			handler: async () => {
				const workspace = await giselle.createWorkspace();
				return JsonResponse.json(workspace);
			},
		}),
	getWorkspace: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) => {
				const workspace = await giselle.getWorkspace(input.workspaceId);
				return JsonResponse.json(workspace);
			},
		}),

	updateWorkspace: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspace: Workspace,
			}),
			handler: async ({ input }) => {
				const workspace = await giselle.updateWorkspace(input.workspace);
				return JsonResponse.json(workspace);
			},
		}),
	getLanguageModelProviders: (giselle: Giselle) =>
		createHandler({
			handler: () => {
				const providers = giselle.getLanguageModelProviders();
				return JsonResponse.json(providers);
			},
		}),
	getGeneration: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generationId: GenerationId.schema,
			}),
			handler: async ({ input }) => {
				const generation = await giselle.getGeneration(input.generationId);
				return JsonResponse.json(generation);
			},
		}),
	getNodeGenerations: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				origin: GenerationOrigin,
				nodeId: NodeId.schema,
			}),
			handler: async ({ input }) => {
				const generations = await giselle.getNodeGenerations(
					input.origin,
					input.nodeId,
				);
				return JsonResponse.json(generations);
			},
		}),
	cancelGeneration: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generationId: GenerationId.schema,
			}),
			handler: async ({ input }) => {
				const generation = await giselle.cancelGeneration(input.generationId);
				return JsonResponse.json(generation);
			},
		}),
	removeFile: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				fileId: FileId.schema,
			}),
			handler: async ({ input }) => {
				await giselle.removeFile(input.workspaceId, input.fileId);
				return new Response(null, { status: 204 });
			},
		}),
	copyFile: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				sourceFileId: FileId.schema,
				destinationFileId: FileId.schema,
			}),
			handler: async ({ input }) => {
				await giselle.copyFile(
					input.workspaceId,
					input.sourceFileId,
					input.destinationFileId,
				);

				return new Response(null, { status: 204 });
			},
		}),
	generateImage: (giselle: Giselle) =>
		withUsageLimitErrorHandler(
			createHandler({
				input: z.object({
					generation: QueuedGeneration,
				}),
				handler: async ({ input, signal }) => {
					await giselle.generateImage(input.generation, signal);
					return new Response(null, { status: 204 });
				},
			}),
		),
	setGeneration: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generation: Generation,
			}),
			handler: async ({ input }) => {
				await giselle.setGeneration(input.generation);
				return new Response(null, { status: 204 });
			},
		}),
	createSampleWorkspaces: (giselle: Giselle) =>
		createHandler({
			handler: async () => {
				const workspaces = await giselle.createSampleWorkspaces();
				return JsonResponse.json(workspaces);
			},
		}),
	getGitHubRepositories: (giselle: Giselle) =>
		createHandler({
			handler: async () => {
				const repositories = await giselle.getGitHubRepositories();
				return JsonResponse.json(repositories);
			},
		}),
	encryptSecret: (giselle: Giselle) =>
		createHandler({
			input: z.object({ plaintext: z.string() }),
			handler: async ({ input }) => {
				return JsonResponse.json({
					encrypted: await giselle.encryptSecret(input.plaintext),
				});
			},
		}),
	resolveTrigger: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					trigger: await giselle.resolveTrigger(input),
				});
			},
		}),
	configureTrigger: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				trigger: ConfigureTriggerInput,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					triggerId: await giselle.configureTrigger(input),
				});
			},
		}),
	getTrigger: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				triggerId: TriggerId.schema,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					trigger: await giselle.getTrigger(input),
				});
			},
		}),
	getGitHubRepositoryFullname: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				repositoryNodeId: z.string(),
				installationId: z.number(),
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					fullname: await giselle.getGitHubRepositoryFullname(input),
				});
			},
		}),
	setTrigger: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				trigger: Trigger,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					triggerId: await giselle.setTrigger(input),
				});
			},
		}),
	reconfigureGitHubTrigger: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				triggerId: TriggerId.schema,
				repositoryNodeId: z.string(),
				installationId: z.number(),
				event: GitHubEventData.optional(),
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					triggerId: await giselle.reconfigureGitHubTrigger(input),
				});
			},
		}),
	deleteTrigger: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				triggerId: TriggerId.schema,
			}),
			handler: async ({ input }) => {
				await giselle.deleteTrigger(input);
				return new Response(null, { status: 204 });
			},
		}),
	executeAction: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
			}),
			handler: async ({ input }) => {
				await giselle.executeAction(input);
				return new Response(null, { status: 204 });
			},
		}),
	createAndStartTask: (giselle: Giselle) =>
		createHandler({
			input: CreateAndStartTaskInputs.omit({ callbacks: true }),
			handler: async ({ input }) => {
				await giselle.createAndStartTask(input);
				return new Response(null, { status: 204 });
			},
		}),
	startTask: (giselle: Giselle) =>
		createHandler({
			input: StartTaskInputs,
			handler: async ({ input }) => {
				await giselle.startTask(input);
				return new Response(null, { status: 204 });
			},
		}),
	executeQuery: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
			}),
			handler: async ({ input }) => {
				await giselle.executeQuery(input.generation);
				return new Response(null, { status: 204 });
			},
		}),
	startDataQueryExecution: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
			}),
			handler: async ({ input }) => {
				await giselle.startDataQueryExecution({
					generation: input.generation,
				});
				return new Response(null, { status: 204 });
			},
		}),
	executeDataQuery: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generation: z.union([QueuedGeneration, RunningGeneration]),
			}),
			handler: async ({ input }) => {
				await giselle.executeDataQuery(input.generation);
				return new Response(null, { status: 204 });
			},
		}),
	addWebPage: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				webpage: FetchingWebPage,
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json(await giselle.addWebPage(input)),
		}),
	getFileText: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				fileId: FileId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					text: await giselle.getFileText({
						workspaceId: input.workspaceId,
						fileId: input.fileId,
					}),
				}),
		}),
	addSecret: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema.optional(),
				label: z.string(),
				value: z.string(),
				tags: z.array(z.string()).optional(),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					secret: await giselle.addSecret(input),
				}),
		}),
	getWorkspaceSecrets: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				tags: z.array(z.string()).optional(),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					secrets: await giselle.getWorkspaceSecrets(input),
				}),
		}),
	createTask: (giselle: Giselle) =>
		createHandler({
			input: CreateTaskInputs,
			handler: async ({ input }) =>
				JsonResponse.json(await giselle.createTask(input)),
		}),
	patchTask: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				taskId: TaskId.schema,
				patches: z.array(z.custom<Patch>()),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					task: await giselle.patchTask(input),
				}),
		}),
	getWorkspaceTasks: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					tasks: await giselle.getWorkspaceTasks(input),
				}),
		}),
	deleteSecret: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				secretId: SecretId.schema,
			}),
			handler: async ({ input }) => {
				await giselle.deleteSecret(input);
				return new Response(null, { status: 204 });
			},
		}),
	streamTask: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				taskId: TaskId.schema,
			}),
			handler: ({ input }) => {
				const stream = giselle.streamTask(input);
				return new Response(stream, {
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache, no-transform",
						Connection: "keep-alive",
					},
				});
			},
		}),
	generateContent: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generation: RunningGeneration,
			}),
			handler: async ({ input }) => {
				const runningGeneration = await giselle.generateContent({
					...input,
				});
				return JsonResponse.json({ generation: runningGeneration });
			},
		}),
	getGenerationMessageChunks: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generationId: GenerationId.schema,
				startByte: z.number().optional(),
			}),
			handler: async ({ input, signal: abortSignal }) => {
				const data = await giselle.getGenerationMessageChunks({
					...input,
					abortSignal,
				});
				return JsonResponse.json(data);
			},
		}),
	startContentGeneration: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				generation: Generation,
			}),
			handler: async ({ input }) => {
				const runningGeneration = await giselle.startContentGeneration({
					...input,
				});
				return JsonResponse.json({ generation: runningGeneration });
			},
		}),
	getWorkspaceInprogressTask: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) => {
				const task = await giselle.getWorkspaceInprogressTask({
					workspaceId: input.workspaceId,
				});
				return JsonResponse.json({ task });
			},
		}),
	getTaskGenerationIndexes: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				taskId: TaskId.schema,
			}),
			handler: async ({ input }) => {
				const result = await giselle.getTaskGenerationIndexes({
					taskId: input.taskId,
				});
				return JsonResponse.json(result);
			},
		}),
	saveApp: (giselle: Giselle) =>
		createHandler({
			input: giselle.saveApp.inputSchema,
			handler: async ({ input }) => {
				await giselle.saveApp(input);
				return new Response(null, { status: 204 });
			},
		}),
	deleteApp: (giselle: Giselle) =>
		createHandler({
			input: giselle.deleteApp.inputSchema,
			handler: async ({ input }) => {
				await giselle.deleteApp(input);
				return new Response(null, { status: 204 });
			},
		}),
	getApp: (giselle: Giselle) =>
		createHandler({
			input: giselle.getApp.inputSchema,
			handler: async ({ input }) => {
				const app = await giselle.getApp(input);
				return JsonResponse.json({ app });
			},
		}),
	createDataStore: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				provider: DataStore.shape.provider,
				configuration: DataStore.shape.configuration,
			}),
			handler: async ({ input }) => {
				const dataStore = await giselle.createDataStore(input);
				return JsonResponse.json({ dataStore });
			},
		}),
	getDataStore: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				dataStoreId: DataStoreId.schema,
			}),
			handler: async ({ input }) => {
				const dataStore = await giselle.getDataStore(input);
				if (!dataStore) {
					return JsonResponse.json(
						{ error: `DataStore not found: ${input.dataStoreId}` },
						{ status: 404 },
					);
				}
				return JsonResponse.json({ dataStore });
			},
		}),
	updateDataStore: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				dataStoreId: DataStoreId.schema,
				configuration: DataStore.shape.configuration,
			}),
			handler: async ({ input }) => {
				const dataStore = await giselle.updateDataStore(input);
				return JsonResponse.json({ dataStore });
			},
		}),
	deleteDataStore: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				dataStoreId: DataStoreId.schema,
			}),
			handler: async ({ input }) => {
				const dataStore = await giselle.deleteDataStore(input);
				if (!dataStore) {
					// For idempotent DELETE, treat not found as success
					return new Response(null, { status: 204 });
				}
				return JsonResponse.json({ dataStore });
			},
		}),
} as const;

// Export the types at module level
export type JsonRoutePath = keyof typeof jsonRoutes;
export type JsonRouteHandlers = {
	[P in JsonRoutePath]: ReturnType<(typeof jsonRoutes)[P]>;
};
export type JsonRouteHandlersInput = {
	[P in JsonRoutePath]: Parameters<JsonRouteHandlers[P]>[0]["input"];
};
export function isJsonRoutePath(path: string): path is JsonRoutePath {
	return path in jsonRoutes;
}

export const formDataRoutes = {
	uploadFile: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				fileId: FileId.schema,
				fileName: z.string(),
				file: z.instanceof(File),
			}),
			handler: async ({ input }) => {
				await giselle.uploadFile(
					input.file,
					input.workspaceId,
					input.fileId,
					input.fileName,
				);
				return new Response(null, { status: 202 });
			},
		}),
} as const;

// Export the types at module level
export type FormDataRoutePath = keyof typeof formDataRoutes;
export type FormDataRouteHandlers = {
	[P in FormDataRoutePath]: ReturnType<(typeof formDataRoutes)[P]>;
};
export type FormDataRouteHandlersInput = {
	[P in FormDataRoutePath]: Parameters<FormDataRouteHandlers[P]>[0]["input"];
};
export function isFormDataRoutePath(path: string): path is FormDataRoutePath {
	return path in formDataRoutes;
}
