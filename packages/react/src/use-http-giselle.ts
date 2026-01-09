"use client";

import { useCallback, useMemo } from "react";
import { APICallError } from "./errors/api-call-error";
import type { GiselleClient } from "./giselle-client";

type FetchOptions = {
	basePath?: string;
};

function jsonHeaders() {
	return { "Content-Type": "application/json" } as const;
}

async function readResponseText(response: Response) {
	try {
		return await response.text();
	} catch {
		return "";
	}
}

export function useHttpGiselle(options?: FetchOptions): GiselleClient {
	const basePath = options?.basePath ?? "/api/giselle";

	const postJson = useCallback(
		async (path: string, input?: unknown) => {
			const response = await fetch(`${basePath}/${path}`, {
				method: "POST",
				headers: jsonHeaders(),
				body: input === undefined ? undefined : JSON.stringify(input),
			});

			if (!response.ok) {
				const errorText = await readResponseText(response);
				throw new APICallError({
					message: errorText || `Error in ${path} operation`,
					url: `${basePath}/${path}`,
					requestBodyValues: input || {},
					statusCode: response.status,
					responseHeaders: Object.fromEntries(response.headers.entries()),
					responseBody: errorText,
				});
			}

			const contentType = response.headers.get("Content-Type");
			if (contentType?.includes("application/json")) {
				return await response.json();
			}
			return;
		},
		[basePath],
	);

	const postFormData = useCallback(
		async (path: string, formData: FormData) => {
			const response = await fetch(`${basePath}/${path}`, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorText = await readResponseText(response);
				throw new APICallError({
					message: errorText || `Error in ${path} operation`,
					url: `${basePath}/${path}`,
					requestBodyValues: {},
					statusCode: response.status,
					responseHeaders: Object.fromEntries(response.headers.entries()),
					responseBody: errorText,
				});
			}

			const contentType = response.headers.get("Content-Type");
			if (contentType?.includes("application/json")) {
				return await response.json();
			}
			return;
		},
		[basePath],
	);

	return useMemo<GiselleClient>(
		() => ({
			// bootstrap
			createWorkspace: async () => postJson("createWorkspace"),
			createSampleWorkspaces: async () => postJson("createSampleWorkspaces"),

			// workspaces
			getWorkspace: async (input) => postJson("getWorkspace", input),
			updateWorkspace: async (input) => postJson("updateWorkspace", input),

			// apps
			getApp: async (input) => postJson("getApp", input),
			saveApp: async (input) => {
				await postJson("saveApp", input);
			},
			deleteApp: async (input) => {
				await postJson("deleteApp", input);
			},

			// tasks
			createTask: async (input) => postJson("createTask", input),
			startTask: async (input) => {
				await postJson("startTask", input);
			},
			getWorkspaceInprogressTask: async (input) =>
				postJson("getWorkspaceInprogressTask", input),
			getTaskGenerationIndexes: async (input) =>
				postJson("getTaskGenerationIndexes", input),
			getWorkspaceTasks: async (input) => postJson("getWorkspaceTasks", input),

			// generations
			getGeneration: async (input) => postJson("getGeneration", input),
			getNodeGenerations: async (input) =>
				postJson("getNodeGenerations", input),
			cancelGeneration: async (input) => postJson("cancelGeneration", input),
			setGeneration: async (input) => {
				await postJson("setGeneration", input);
			},
			generateImage: async (input) => {
				await postJson("generateImage", input);
			},
			startContentGeneration: async (input) =>
				postJson("startContentGeneration", input),
			getGenerationMessageChunks: async (input) =>
				postJson("getGenerationMessageChunks", input),
			generateContent: async (input) => postJson("generateContent", input),

			// triggers + ops
			resolveTrigger: async (input) => postJson("resolveTrigger", input),
			configureTrigger: async (input) => postJson("configureTrigger", input),
			getTrigger: async (input) => postJson("getTrigger", input),
			setTrigger: async (input) => postJson("setTrigger", input),
			reconfigureGitHubTrigger: async (input) =>
				postJson("reconfigureGitHubTrigger", input),
			executeAction: async (input) => {
				await postJson("executeAction", input);
			},
			executeQuery: async (input) => {
				await postJson("executeQuery", input);
			},
			getGitHubRepositoryFullname: async (input) =>
				postJson("getGitHubRepositoryFullname", input),

			// files
			uploadFile: async (input) => {
				await postFormData("uploadFile", input);
			},
			removeFile: async (input) => {
				await postJson("removeFile", input);
			},
			copyFile: async (input) => {
				await postJson("copyFile", input);
			},
			getFileText: async (input) => postJson("getFileText", input),
			addWebPage: async (input) => postJson("addWebPage", input),

			// secrets
			addSecret: async (input) => postJson("addSecret", input),
			deleteSecret: async (input) => {
				await postJson("deleteSecret", input);
			},
			getWorkspaceSecrets: async (input) =>
				postJson("getWorkspaceSecrets", input),
		}),
		[postJson, postFormData],
	);
}
