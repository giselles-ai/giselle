import { useCallback, useMemo } from "react";
import type { z } from "zod/v4";
import type {
	FormDataRouterHandlers,
	FormDataRouterInput,
	FormDataRouterPaths,
	JsonRouterHandlers,
	JsonRouterInput,
	JsonRouterPaths,
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
		} else if (typeof value === "boolean") {
			formData.append(key, JSON.stringify(value));
		} else {
			console.warn(`Unsupported type for key ${key}: ${typeof value}`);
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
					options?: { signal?: AbortSignal },
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
		async (
			path: string,
			input?: unknown,
			isFormData = false,
			options?: { signal?: AbortSignal },
		) => {
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
				signal: options?.signal,
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

	// Create a proxy-based client that dynamically handles API requests
	const client = useMemo(() => {
		// Create a Proxy that will lazily create methods when accessed
		const proxyClient = new Proxy(
			{
				basePath,
			},
			{
				get: (target, prop) => {
					// Return basePath property directly
					if (prop === "basePath") {
						return target.basePath;
					}

					// For other properties, create a method that makes the API request
					// We check if it's a string because symbols can also be used as props
					if (typeof prop === "string") {
						// Create methods on-demand
						// We determine if it's a FormData endpoint based on our knowledge
						// of the API design (there's only "uploadFile" that uses FormData)
						const isFormData = prop === "uploadFile";

						return (input?: unknown, options?: { signal?: AbortSignal }) =>
							makeRequest(prop, input, isFormData, options);
					}

					return undefined;
				},
			},
		);

		return proxyClient as GiselleEngineClient;
	}, [makeRequest, basePath]);

	return client;
}
