import type { z } from "zod";
import type { GiselleEngineContext } from "./types";

/**
 * Type definition for arguments passed to Giselle engine handlers.
 *
 * @template TInput The expected input type for the handler
 * @template TOutput The expected output type for the handler
 */
export type GiselleEngineHandlerArgs<TInput> = {
	/**
	 * Input data for the handler, validated against the input schema
	 */
	input: TInput;

	/**
	 * Context information for the generation process
	 */
	context: GiselleEngineContext;
};

/**
 * Creates a typed handler for processing generation requests with input and output validation.
 *
 * @param schemas Object containing Zod schemas for input and output validation
 * @param handler The handler function that processes the request
 * @returns A function that validates input, processes the request, and validates output
 */
export function createHandler<TInput extends z.AnyZodObject, TOutput>(
	{
		input,
	}: {
		input: TInput;
	},
	handler: (args: GiselleEngineHandlerArgs<z.infer<TInput>>) => TOutput,
) {
	return async (args: {
		input: unknown;
		context: GiselleEngineContext;
	}): Promise<TOutput> => {
		// Validate input
		const validatedInput = input.parse(args.input) as TInput;

		// Process request with validated input
		const result = await handler({
			input: validatedInput,
			context: args.context,
		});
		return result;
	};
}
