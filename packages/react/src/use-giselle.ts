"use client";

import type {
	FormDataRouteHandlers,
	FormDataRouteHandlersInput,
	FormDataRoutePath,
	JsonResponse,
	JsonRouteHandlers,
	JsonRouteHandlersInput,
	JsonRoutePath,
} from "@giselles-ai/http";
import {
	createContext,
	createElement,
	useCallback,
	useContext,
	useMemo,
} from "react";
import type * as z from "zod/v4";

import { APICallError } from "./errors/api-call-error";

type FetchOptions = {
	basePath?: string;
};

export type GiselleRequestOptions = {
	signal?: AbortSignal;
	keepalive?: boolean;
};

const responseReturnPaths = new Set<string>(["streamTask"]);

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
type ExtractResponseData<T> = T extends Promise<infer U>
	? ExtractResponseData<U>
	: T extends JsonResponse<infer U>
		? U
		: T extends Response
			? undefined
			: T;

/**
 * GiselleClient type definition
 * Provides autocomplete and type checking for all API endpoints
 */
export type GiselleClient = {
	[K in JsonRoutePath | FormDataRoutePath]: K extends "streamTask"
		? (
				input: z.infer<JsonRouteHandlersInput[K]>,
				options?: GiselleRequestOptions,
			) => Promise<Response>
		: K extends JsonRoutePath
			? JsonRouteHandlersInput[K] extends z.ZodType<unknown>
				? (
						input: z.infer<JsonRouteHandlersInput[K]>,
						options?: GiselleRequestOptions,
					) => Promise<
						ExtractResponseData<Awaited<ReturnType<JsonRouteHandlers[K]>>>
					>
				: () => Promise<
						ExtractResponseData<Awaited<ReturnType<JsonRouteHandlers[K]>>>
					>
			: K extends FormDataRoutePath
				? FormDataRouteHandlersInput[K] extends z.ZodType<unknown>
					? (
							input: z.infer<FormDataRouteHandlersInput[K]>,
						) => Promise<
							ExtractResponseData<Awaited<ReturnType<FormDataRouteHandlers[K]>>>
						>
					: () => Promise<
							ExtractResponseData<Awaited<ReturnType<FormDataRouteHandlers[K]>>>
						>
				: never;
} & {
	basePath: string;
};

const GiselleClientContext = createContext<GiselleClient | null>(null);

export function GiselleClientProvider({
	children,
	value,
}: React.PropsWithChildren<{ value: GiselleClient }>) {
	// Avoid JSX in a .ts module.
	return createElement(GiselleClientContext.Provider, { value }, children);
}

/**
 * Custom hook that provides a type-safe client for the Giselle API
 *
 * @param options Configuration options for the client
 * @returns A client object with methods for each Giselle operation
 */
export function useGiselle(options?: FetchOptions): GiselleClient {
	const injectedClient = useContext(GiselleClientContext);

	const basePath =
		injectedClient?.basePath ?? options?.basePath ?? "/api/giselle";

	// Function to make API requests
	const makeRequest = useCallback(
		async (
			path: string,
			input?: unknown,
			isFormData = false,
			options?: GiselleRequestOptions,
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
				keepalive: options?.keepalive,
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

			if (responseReturnPaths.has(path)) {
				return response;
			}
			return;
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

						return (input?: unknown, options?: GiselleRequestOptions) =>
							makeRequest(prop, input, isFormData, options);
					}

					return undefined;
				},
			},
		);

		return proxyClient as GiselleClient;
	}, [makeRequest, basePath]);

	return injectedClient ?? client;
}
