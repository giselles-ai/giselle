import {
	ConfigureTriggerInput,
	CreateActInputs,
	CreateAndStartActInputs,
	type Giselle,
	type Patch,
	StartActInputs,
} from "@giselles-ai/giselle";
import {
	ActId,
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
	Trigger,
	TriggerId,
	Workspace,
	WorkspaceId,
} from "@giselles-ai/protocol";
import * as z from "zod/v4";
import { createHandler, withUsageLimitErrorHandler } from "./create-handler";
import { JsonResponse } from "./json-response";

export const createJsonRouters = {
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
	createAndStartAct: (giselle: Giselle) =>
		createHandler({
			input: CreateAndStartActInputs.omit({ callbacks: true }),
			handler: async ({ input }) => {
				await giselle.createAndStartAct(input);
				return new Response(null, { status: 204 });
			},
		}),
	startAct: (giselle: Giselle) =>
		createHandler({
			input: StartActInputs,
			handler: async ({ input }) => {
				await giselle.startAct(input);
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
				workspaceId: WorkspaceId.schema,
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
	createAct: (giselle: Giselle) =>
		createHandler({
			input: CreateActInputs,
			handler: async ({ input }) =>
				JsonResponse.json(await giselle.createAct(input)),
		}),
	patchAct: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				actId: ActId.schema,
				patches: z.array(z.custom<Patch>()),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					act: await giselle.patchAct(input),
				}),
		}),
	getWorkspaceActs: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					acts: await giselle.getWorkspaceActs(input),
				}),
		}),
	deleteSecret: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				secretId: SecretId.schema,
			}),
			handler: async ({ input }) => {
				await giselle.deleteSecret(input);
				return new Response(null, { status: 204 });
			},
		}),
	streamAct: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				actId: ActId.schema,
			}),
			handler: ({ input }) => {
				const stream = giselle.streamAct(input);
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
	getWorkspaceInprogressAct: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) => {
				const act = await giselle.getWorkspaceInprogressAct({
					workspaceId: input.workspaceId,
				});
				return JsonResponse.json({ act });
			},
		}),
	getActGenerationIndexes: (giselle: Giselle) =>
		createHandler({
			input: z.object({
				actId: ActId.schema,
			}),
			handler: async ({ input }) => {
				const result = await giselle.getActGenerationIndexes({
					actId: input.actId,
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
