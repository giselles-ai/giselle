import {
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
import { z } from "zod";
import type { GiselleEngine } from "../core";
import type { TelemetrySettings } from "../core/generations";
import { getInstallationRepositories } from "../core/github";
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
					return stream.toDataStreamResponse();
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
				fileName: z.string(),
			}),
			handler: async ({ input }) => {
				await giselleEngine.removeFile(
					input.workspaceId,
					input.fileId,
					input.fileName,
				);
				return new Response(null, { status: 204 });
			},
		}),
	githubUrlToObjectId: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				url: z.string().url(),
				installationId: z.number(),
			}),
			handler: async ({ input }) => {
				const objectId = await giselleEngine.githubUrlToObjectId(
					input.url,
					input.installationId,
				);
				return JsonResponse.json({ objectId });
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
	getInstallationRepositories: (giselleEngine: GiselleEngine) =>
		createHandler({
			input: z.object({
				installationIds: z.number().array(),
			}),
			handler: async ({ input }) => {
				const repositories = await giselleEngine.getInstallationRepositories(
					input.installationIds,
				);
				return JsonResponse.json(repositories);
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
