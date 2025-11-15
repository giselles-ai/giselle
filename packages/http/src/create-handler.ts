import { type GiselleContext, UsageLimitError } from "@giselles-ai/giselle";
import type * as z from "zod/v4";

/**
 * Type definition for handler arguments that conditionally includes input
 * based on whether an input schema is provided
 */
type HandlerArgs<TSchema> = TSchema extends z.ZodObject
	? {
			input: z.infer<TSchema>;
			context: GiselleContext;
			signal?: AbortSignal;
		}
	: {
			context: GiselleContext;
			signal?: AbortSignal;
		};

/**
 * Type definition for arguments passed to the created handler function
 */
type HandlerInputArgs<TSchema> = TSchema extends z.ZodObject
	? {
			input: TSchema;
			context: GiselleContext;
			signal?: AbortSignal;
		}
	: {
			input?: unknown;
			context: GiselleContext;
			signal?: AbortSignal;
		};

/**
 * Creates a typed handler for processing generation requests with optional input validation.
 *
 * @param options Configuration object for the handler
 * @returns A function that validates input (if schema provided) and processes the request
 */
export function createHandler<
	TOutput,
	TSchema extends z.ZodObject | undefined = undefined,
>({
	input,
	handler,
}: {
	input?: TSchema;
	handler: (args: HandlerArgs<TSchema>) => TOutput;
}) {
	return async (args: HandlerInputArgs<TSchema>): Promise<Awaited<TOutput>> => {
		if (input !== undefined) {
			// Validate input against schema
			const validatedInput = input.parse(args.input);

			// Process request with validated input
			return await handler({
				input: validatedInput,
				context: args.context,
				signal: args.signal,
			} as HandlerArgs<TSchema>);
		}

		// Process request without input validation
		return await handler({
			context: args.context,
			signal: args.signal,
		} as HandlerArgs<TSchema>);
	};
}

/**
 * Higher-order function that wraps a handler to catch and handle UsageLimitError.
 *
 * @param handler The original handler function
 * @returns A new handler function that catches UsageLimitError and returns a 429 response
 */
export function withUsageLimitErrorHandler<
	TOutput,
	TSchema extends z.ZodObject | undefined = undefined,
>(
	handler: (args: HandlerInputArgs<TSchema>) => Promise<TOutput>,
): (args: HandlerInputArgs<TSchema>) => Promise<TOutput | Response> {
	return async (args: HandlerInputArgs<TSchema>) => {
		try {
			return await handler(args);
		} catch (error) {
			if (error instanceof UsageLimitError) {
				return new Response(error.message, { status: 429 });
			}
			throw error;
		}
	};
}
