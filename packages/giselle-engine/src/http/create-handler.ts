import type { z } from "zod";
import type { GiselleEngineContext } from "../core";

/**
 * Type definition for handler arguments that conditionally includes input
 * based on whether an input schema is provided
 */
type HandlerArgs<TSchema> = TSchema extends z.AnyZodObject
	? {
			input: z.infer<TSchema>;
			context: GiselleEngineContext;
		}
	: {
			context: GiselleEngineContext;
		};

/**
 * Type definition for arguments passed to the created handler function
 */
type HandlerInputArgs<TSchema> = TSchema extends z.AnyZodObject
	? {
			input: TSchema;
			context: GiselleEngineContext;
		}
	: {
			input?: unknown;
			context: GiselleEngineContext;
		};

/**
 * Creates a typed handler for processing generation requests with optional input validation.
 *
 * @param options Configuration object for the handler
 * @returns A function that validates input (if schema provided) and processes the request
 */
export function createHandler<
	TOutput,
	TSchema extends z.AnyZodObject | undefined = undefined,
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
			} as HandlerArgs<TSchema>);
		}

		// Process request without input validation
		return await handler({
			context: args.context,
		} as HandlerArgs<TSchema>);
	};
}
