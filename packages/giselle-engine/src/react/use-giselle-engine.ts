import { useCallback, useMemo } from "react";
import type { AnyZodObject, z } from "zod";
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

type ExtractResponseData<T> = T extends JsonResponse<infer U>
	? U
	: T extends Promise<infer U>
		? U
		: T;

type JsonMethodWithInput<P extends JsonRouterPaths> = (
	input: JsonRouterInput[P] extends z.AnyZodObject
		? z.infer<JsonRouterInput[P]>
		: never,
) => Promise<ExtractResponseData<Awaited<ReturnType<JsonRouterHandlers[P]>>>>;

type JsonMethodWithoutInput<P extends JsonRouterPaths> = () => Promise<
	ExtractResponseData<Awaited<ReturnType<JsonRouterHandlers[P]>>>
>;

type FormDataMethodWithInput<P extends FormDataRouterPaths> = (
	input: FormDataRouterInput[P] extends z.AnyZodObject
		? z.infer<FormDataRouterInput[P]>
		: never,
) => Promise<
	ExtractResponseData<Awaited<ReturnType<FormDataRouterHandlers[P]>>>
>;

type FormDataMethodWithoutInput<P extends FormDataRouterPaths> = () => Promise<
	ExtractResponseData<Awaited<ReturnType<FormDataRouterHandlers[P]>>>
>;

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

type GiselleEngineClient = {
	[P in JsonRouterPaths]: JsonRouterInput[P] extends AnyZodObject
		? JsonMethodWithInput<P>
		: JsonMethodWithoutInput<P>;
} & {
	[P in FormDataRouterPaths]: FormDataRouterInput[P] extends AnyZodObject
		? FormDataMethodWithInput<P>
		: FormDataMethodWithoutInput<P>;
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

	/**
	 * Generic fetch function that handles API requests with proper typing
	 */
	const fetchApi = useCallback(
		async <TPath extends JsonRouterPaths>(
			path: TPath,
			input?: JsonRouterInput[TPath],
			transformToFormData = false,
		) => {
			// Check if input is FormData
			const response = await fetch(`${basePath}/${path}`, {
				method: "POST",
				// Don't set Content-Type header for FormData (browser will set it with boundary)
				headers: transformToFormData
					? undefined
					: { "Content-Type": "application/json" },
				// If it's FormData, send it directly; otherwise, stringify as JSON
				body: transformToFormData
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
	/**
	 * Creates a method for a specific router path
	 */
	const createMethod = useCallback(
		<TPath extends JsonRouterPaths>(path: TPath, transformToForm = false) => {
			type InputType = JsonRouterInput[TPath];

			// Create a function that is correctly typed based on whether input is required
			return (async (
				input?: InputType extends undefined ? never : InputType,
			) => {
				// @ts-expect-error
				const result = await fetchApi(path, input as unknown, transformToForm);
				return result;
			}) as GiselleEngineClient[TPath];
		},
		[fetchApi],
	);

	/**
	 * Generate the client object with all router methods
	 */
	const client = useMemo(() => {
		const jsonRouterMethods = jsonRouterPaths.reduce(
			(acc, path) => {
				// @ts-expect-error
				acc[path] = createMethod(path);
				return acc;
			},
			{} as Partial<GiselleEngineClient>,
		);

		const formDataRouterMethods = formDataRouterPaths.reduce(
			(acc, path) => {
				// @ts-expect-error
				acc[path] = createMethod(path, true);
				return acc;
			},
			{} as Partial<GiselleEngineClient>,
		);

		return {
			...jsonRouterMethods,
			...formDataRouterMethods,
			basePath,
		} as GiselleEngineClient;
	}, [createMethod, basePath]);

	return client;
}
