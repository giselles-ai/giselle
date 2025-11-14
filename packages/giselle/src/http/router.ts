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
import { z } from "zod/v4";
import type { GiselleEngine } from "../engine";
import {
	CreateActInputs,
	CreateAndStartActInputs,
	type Patch,
	StartActInputs,
} from "../engine/acts";
import { ConfigureTriggerInput } from "../engine/triggers";
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
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
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
			handler: () => {
				const providers = giselleEngine.getLanguageModelProviders();
				return JsonResponse.json(providers);
			},
		}),
	getGeneration: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generationId: GenerationId.schema,
			}),
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
			input: z.object({
				generationId: GenerationId.schema,
			}),
			handler: async ({ input }) => {
				const generation = await giselleEngine.cancelGeneration(
					input.generationId,
				);
				return JsonResponse.json(generation);
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
	copyFile: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
				sourceFileId: FileId.schema,
				destinationFileId: FileId.schema,
			}),
			handler: async ({ input }) => {
				await giselleEngine.copyFile(
					input.workspaceId,
					input.sourceFileId,
					input.destinationFileId,
				);

				return new Response(null, { status: 204 });
			},
		}),
	generateImage: (giselleEngine: GiselleEngine) =>
		withUsageLimitErrorHandler(
			createHandler({
				input: z.object({
					generation: QueuedGeneration,
				}),
				handler: async ({ input, signal }) => {
					await giselleEngine.generateImage(input.generation, signal);
					return new Response(null, { status: 204 });
				},
			}),
		),
	setGeneration: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generation: Generation,
			}),
			handler: async ({ input }) => {
				await giselleEngine.setGeneration(input.generation);
				return new Response(null, { status: 204 });
			},
		}),
	createSampleWorkspaces: (giselleEngine: GiselleEngine) =>
		createHandler({
			handler: async () => {
				const workspaces = await giselleEngine.createSampleWorkspaces();
				return JsonResponse.json(workspaces);
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
				triggerId: TriggerId.schema,
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
				trigger: Trigger,
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					triggerId: await giselleEngine.setTrigger(input),
				});
			},
		}),
	reconfigureGitHubTrigger: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				triggerId: TriggerId.schema,
				repositoryNodeId: z.string(),
				installationId: z.number(),
				event: GitHubEventData.optional(),
			}),
			handler: async ({ input }) => {
				return JsonResponse.json({
					triggerId: await giselleEngine.reconfigureGitHubTrigger(input),
				});
			},
		}),
	deleteTrigger: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				triggerId: TriggerId.schema,
			}),
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
	createAndStartAct: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: CreateAndStartActInputs.omit({ callbacks: true }),
			handler: async ({ input }) => {
				await giselleEngine.createAndStartAct(input);
				return new Response(null, { status: 204 });
			},
		}),
	startAct: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: StartActInputs,
			handler: async ({ input }) => {
				await giselleEngine.startAct(input);
				return new Response(null, { status: 204 });
			},
		}),
	executeQuery: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generation: QueuedGeneration,
			}),
			handler: async ({ input }) => {
				await giselleEngine.executeQuery(input.generation);
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
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					text: await giselleEngine.getFileText({
						workspaceId: input.workspaceId,
						fileId: input.fileId,
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
	createAct: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: CreateActInputs,
			handler: async ({ input }) =>
				JsonResponse.json(await giselleEngine.createAct(input)),
		}),
	patchAct: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				actId: ActId.schema,
				patches: z.array(z.custom<Patch>()),
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					act: await giselleEngine.patchAct(input),
				}),
		}),
	getWorkspaceActs: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) =>
				JsonResponse.json({
					acts: await giselleEngine.getWorkspaceActs(input),
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
	streamAct: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				actId: ActId.schema,
			}),
			handler: ({ input }) => {
				const stream = giselleEngine.streamAct(input);
				return new Response(stream, {
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache, no-transform",
						Connection: "keep-alive",
					},
				});
			},
		}),
	generateContent: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generation: RunningGeneration,
			}),
			handler: async ({ input }) => {
				const runningGeneration = await giselleEngine.generateContent({
					...input,
				});
				return JsonResponse.json({ generation: runningGeneration });
			},
		}),
	getGenerationMessageChunks: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generationId: GenerationId.schema,
				startByte: z.number().optional(),
			}),
			handler: async ({ input, signal: abortSignal }) => {
				const data = await giselleEngine.getGenerationMessageChunks({
					...input,
					abortSignal,
				});
				return JsonResponse.json(data);
			},
		}),
	startContentGeneration: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				generation: Generation,
			}),
			handler: async ({ input }) => {
				const runningGeneration = await giselleEngine.startContentGeneration({
					...input,
				});
				return JsonResponse.json({ generation: runningGeneration });
			},
		}),
	getWorkspaceInprogressAct: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				workspaceId: WorkspaceId.schema,
			}),
			handler: async ({ input }) => {
				const act = await giselleEngine.getWorkspaceInprogressAct({
					workspaceId: input.workspaceId,
				});
				return JsonResponse.json({ act });
			},
		}),
	getActGenerationIndexes: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				actId: ActId.schema,
			}),
			handler: async ({ input }) => {
				const result = await giselleEngine.getActGenerationIndexes({
					actId: input.actId,
				});
				return JsonResponse.json(result);
			},
		}),
	saveApp: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: giselleEngine.saveApp.inputSchema,
			handler: async ({ input }) => {
				await giselleEngine.saveApp(input);
				return new Response(null, { status: 204 });
			},
		}),
	deleteApp: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: giselleEngine.deleteApp.inputSchema,
			handler: async ({ input }) => {
				await giselleEngine.deleteApp(input);
				return new Response(null, { status: 204 });
			},
		}),
	getApp: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: giselleEngine.getApp.inputSchema,
			handler: async ({ input }) => {
				const app = await giselleEngine.getApp(input);
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
