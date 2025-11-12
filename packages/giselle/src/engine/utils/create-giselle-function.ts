import type { z } from "zod/v4";
import type { GiselleEngineContext } from "../types";

/**
 * Type definition for handler function arguments that includes validated input
 */
type HandlerArgs<TSchema extends z.ZodObject> = {
	input: z.infer<TSchema>;
	context: GiselleEngineContext;
};

/**
 * Type definition for arguments passed to the created function
 */
type FunctionInputArgs<_TSchema extends z.ZodObject> = {
	input: unknown;
	context: GiselleEngineContext;
};

/**
 * Creates a typed function for processing requests with input validation.
 *
 * @param options Configuration object for the function
 * @returns A function that validates input and processes the request
 */
export function createGiselleFunction<TOutput, TSchema extends z.ZodObject>({
	input,
	handler,
}: {
	input: TSchema;
	handler: (args: HandlerArgs<TSchema>) => TOutput;
}) {
	return async (
		args: FunctionInputArgs<TSchema>,
	): Promise<Awaited<TOutput>> => {
		// Validate input against schema
		const validatedInput = input.parse(args.input);

		// Process request with validated input
		return await handler({
			input: validatedInput,
			context: args.context,
		});
	};
}
