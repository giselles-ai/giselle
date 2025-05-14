import { useCallback, useMemo } from "react";
import type { z } from "zod";
import {
	type FormDataRouterHandlers,
	type FormDataRouterInput,
	type FormDataRouterPaths,
	type JsonRouterHandlers,
	type JsonRouterInput,
	type JsonRouterPaths,
	formDataRouterPaths,
	jsonRouterPaths,
} from "../http/router";
import type { JsonResponse } from "../utils";
import { APICallError } from "./errors/api-call-error";

type FetchOptions = {
	basePath?: string;
};

/**
 * Converts JSON object to FormData
 */
function transformJsonToFormData(json: Record<string, unknown>): FormData {
	const formData = new FormData();
	for (const key in json) {
		const value = json[key];
		if (
			value instanceof File ||
			value instanceof Blob ||
			typeof value === "string"
		) {
			formData.append(key, value);
		}
	}
	return formData;
}

/**
 * Extract response data type from API handler return types
 */
type ExtractResponseData<T> = T extends JsonResponse<infer U>
	? U
	: T extends Promise<infer U>
		? U
		: T;

/**
 * GiselleEngineClient type definition
 * Provides autocomplete and type checking for all API endpoints
 */
export type GiselleEngineClient = {
	[K in JsonRouterPaths | FormDataRouterPaths]: K extends JsonRouterPaths
		? JsonRouterInput[K] extends z.ZodType<unknown>
			? (
					input: z.infer<JsonRouterInput[K]>,
				) => Promise<
					ExtractResponseData<Awaited<ReturnType<JsonRouterHandlers[K]>>>
				>
			: () => Promise<
					ExtractResponseData<Awaited<ReturnType<JsonRouterHandlers[K]>>>
				>
		: K extends FormDataRouterPaths
			? FormDataRouterInput[K] extends z.ZodType<unknown>
				? (
						input: z.infer<FormDataRouterInput[K]>,
					) => Promise<
						ExtractResponseData<Awaited<ReturnType<FormDataRouterHandlers[K]>>>
					>
				: () => Promise<
						ExtractResponseData<Awaited<ReturnType<FormDataRouterHandlers[K]>>>
					>
			: never;
} & {
	basePath: string;
};

/**
 * Custom hook that provides a type-safe client for the GiselleEngine API
 *
 * @param options Configuration options for the client
 * @returns A client object with methods for each GiselleEngine operation
 */
export function useGiselleEngine(options?: FetchOptions): GiselleEngineClient {
	const basePath = options?.basePath ?? "/api/giselle";

	// Function to make API requests
	const makeRequest = useCallback(
		async (path: string, input?: unknown, isFormData = false) => {
			const response = await fetch(`${basePath}/${path}`, {
				method: "POST",
				headers: isFormData
					? undefined
					: { "Content-Type": "application/json" },
				body: isFormData
					? transformJsonToFormData(input as Record<string, unknown>)
					: input
						? JSON.stringify(input)
						: undefined,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new APICallError({
					message: errorText || `Error in ${path} operation`,
					url: `${basePath}/${path}`,
					requestBodyValues: input || {},
					statusCode: response.status,
					responseHeaders: Object.fromEntries(response.headers.entries()),
					responseBody: errorText,
				});
			}

			// Handle both JSON responses and stream responses
			const contentType = response.headers.get("Content-Type");
			if (contentType?.includes("application/json")) {
				return await response.json();
			}

			return response;
		},
		[basePath],
	);

	// Create the client object with all API methods
	const client = useMemo(() => {
		const methods = {} as Record<string, unknown>;

		// Add JSON router methods
		for (const path of jsonRouterPaths) {
			methods[path] = (input?: unknown) => makeRequest(path, input, false);
		}

		// Add FormData router methods
		for (const path of formDataRouterPaths) {
			methods[path] = (input?: unknown) => makeRequest(path, input, true);
		}

		return {
			...methods,
			basePath,
		} as GiselleEngineClient;
	}, [makeRequest, basePath]);

	return client;
}
