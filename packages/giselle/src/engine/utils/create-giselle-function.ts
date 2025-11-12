import type { z } from "zod/v4";
import type { GiselleEngineContext } from "../types";

type HandlerArgs<TSchema extends z.ZodObject> = {
	input: z.infer<TSchema>;
	context: GiselleEngineContext;
};

type FunctionInputArgs<TSchema extends z.ZodObject> = {
	input: z.infer<TSchema>;
	context: GiselleEngineContext;
};

export type GiselleFunctionInput<
	// biome-ignore lint/suspicious/noExplicitAny: For use in utility functions
	T extends (args: { input: any; context: GiselleEngineContext }) => unknown,
> = Parameters<T>[0]["input"];

export function createGiselleFunction<
	TInputSchema extends z.ZodObject,
	TOutput,
>({
	input,
	handler,
}: {
	input: TInputSchema;
	handler: (args: HandlerArgs<TInputSchema>) => TOutput;
}) {
	return async (
		args: FunctionInputArgs<TInputSchema>,
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
