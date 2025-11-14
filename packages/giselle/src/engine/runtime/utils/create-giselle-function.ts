import type * as z from "zod/v4";
import type { GiselleEngineContext } from "../../contracts";

type HandlerArgs<TSchema extends z.ZodObject> = {
	input: z.infer<TSchema>;
	context: GiselleEngineContext;
};

type FunctionInputArgs<TSchema extends z.ZodObject> = {
	input: z.infer<TSchema>;
	context: GiselleEngineContext;
};

type GiselleFunctionInput<
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
	const fn = async (
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

	return Object.assign(fn, { inputSchema: input });
}

/**
 * Binds a Giselle function to a context to be used as a GiselleEngine method.
 * Transfers the inputSchema property so it can be accessed from the engine instance.
 */
export function bindGiselleFunction<
	T extends {
		inputSchema: z.ZodObject;
	} & ((args: {
		// biome-ignore lint/suspicious/noExplicitAny: For use in utility functions
		input: any;
		context: GiselleEngineContext;
	}) => unknown),
>(
	fn: T,
	context: GiselleEngineContext,
): ((input: GiselleFunctionInput<T>) => Promise<Awaited<ReturnType<T>>>) & {
	inputSchema: T["inputSchema"];
} {
	return Object.assign(
		(input: GiselleFunctionInput<T>) => {
			return fn({ input, context });
		},
		{ inputSchema: fn.inputSchema },
	) as ((input: GiselleFunctionInput<T>) => Promise<Awaited<ReturnType<T>>>) & {
		inputSchema: T["inputSchema"];
	};
}
