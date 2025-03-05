import type { Octokit } from "@octokit/core";
import type { z } from "zod";

// MARK: Tool types
export interface Tool<
	TName extends string = string,
	TInput extends z.ZodType = z.ZodType,
	TOutput = unknown,
> {
	name: TName;
	description: string;
	purpose: string;
	inputSchema: TInput;
	execute: (octokit: Octokit, input: z.infer<TInput>) => Promise<TOutput>;
	examples?: {
		input: z.infer<TInput>;
		output: TOutput;
		description: string;
	}[];
	constraints?: string[];
}

interface DefineToolOptions<
	TName extends string,
	TInputSchema extends z.ZodType,
	TOutput,
> {
	name: TName;
	description: string;
	purpose: string;
	inputSchema: TInputSchema;
	execute: (octokit: Octokit, input: z.infer<TInputSchema>) => Promise<TOutput>;
	constraints?: string[];
}

export function defineTool<
	TName extends string,
	TInputSchema extends z.ZodType,
	TOutput,
>(
	opts: DefineToolOptions<TName, TInputSchema, TOutput>,
): Tool<TName, TInputSchema, TOutput> {
	return {
		name: opts.name,
		description: opts.description,
		purpose: opts.purpose,
		inputSchema: opts.inputSchema,
		execute: opts.execute,
		constraints: opts.constraints,
	};
}
