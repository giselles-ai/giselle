import type { Octokit } from "@octokit/core";
import { RequestError } from "@octokit/request-error";
import { z } from "zod";

// MARK: Tool types
export interface Tool<
	TName extends string,
	TInput extends z.ZodType,
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

// Utility type to extract schema type from a tool
export type ToolSchema<T> = T extends Tool<string, infer S, unknown>
	? S
	: never;

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
	examples?: Array<{
		input: z.infer<TInputSchema>;
		output: TOutput;
		description: string;
	}>;
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
		examples: opts.examples,
		constraints: opts.constraints,
	};
}

// MARK: Tool registry
export class ToolRegistry {
	private tools = new Map<string, Tool<string, z.ZodType, unknown>>();
	private octokit: Octokit;

	constructor(octokit: Octokit) {
		this.octokit = octokit;
	}

	private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
		let retryCount = 0;
		const maxRetries = 3;
		const baseDelay = 1000; // 1 second

		while (true) {
			try {
				return await operation();
			} catch (error) {
				if (error instanceof RequestError) {
					const isRetryable = [429, 502, 503, 504].includes(error.status);
					if (isRetryable && retryCount < maxRetries) {
						retryCount++;
						const delay = baseDelay * 2 ** (retryCount - 1);
						console.warn(
							`Retrying request (${retryCount}/${maxRetries}) after ${delay}ms`,
						);
						await new Promise((resolve) => setTimeout(resolve, delay));
						continue;
					}
					console.error(error.message);
					throw error;
				}
				throw error;
			}
		}
	}

	register<TName extends string, TInput extends z.ZodType, TOutput>(
		tool: Tool<TName, TInput, TOutput>,
	) {
		// Convert to base tool type with unknown output
		const baseTool: Tool<string, z.ZodType, unknown> = {
			...tool,
			execute: async (octokit: Octokit, input: unknown) => {
				return await tool.execute(octokit, input);
			},
		};
		this.tools.set(tool.name, baseTool);
	}

	getTool<TName extends string, TInput extends z.ZodType, TOutput>(
		name: TName,
	): Tool<TName, TInput, TOutput> | undefined {
		const tool = this.tools.get(name);
		if (!tool) return undefined;
		// Convert back to specific tool type
		return {
			...tool,
			execute: async (octokit: Octokit, input: z.infer<TInput>) => {
				return (await tool.execute(octokit, input)) as TOutput;
			},
		} as Tool<TName, TInput, TOutput>;
	}

	async executeTool<TName extends string>(
		name: TName,
		input: unknown,
	): Promise<unknown> {
		const tool = this.tools.get(name);
		if (!tool) {
			throw new Error(`Tool ${name} not found`);
		}

		try {
			tool.inputSchema.parse(input);
		} catch (error) {
			throw new Error(`Invalid input for tool ${name}: ${error}`);
		}
		return await this.withRetry(() => tool.execute(this.octokit, input));
	}

	generateToolDescriptions(): string {
		let descriptions = "";
		for (const tool of this.tools.values()) {
			descriptions += "<tool>\n";
			descriptions += `<n>${tool.name}<n>\n`;
			descriptions += `<purpose>${tool.purpose}</purpose>\n`;
			descriptions += `<description>${tool.description}</description>\n`;
			if (tool.constraints && tool.constraints.length > 0) {
				descriptions += "<constraints>\n";
				for (const constraint of tool.constraints) {
					descriptions += `<constraint>${constraint}</constraint>\n`;
				}
				descriptions += "</constraints>\n";
			}
			// if (tool.examples && tool.examples.length > 0) {
			//   descriptions += "<examples>\n";
			//   tool.examples.forEach((example: { description: string; input: unknown; output: unknown }) => {
			//     descriptions += "<example>\n";
			//     descriptions += `<description>${example.description}</description>\n`;
			//     descriptions += `<input>${JSON.stringify(example.input, null, 2)}</input>\n`;
			//     descriptions += `<o>${JSON.stringify(example.output, null, 2)}<o>\n`;
			//     descriptions += "</example>\n";
			//   });
			//   descriptions += "</examples>\n";
			// }
			descriptions += "</tool>\n\n";
		}
		return `<tools>\n${descriptions}</tools>`;
	}

	/**
	 * Get the combined input schema for all registered tools
	 * @returns A Zod schema that validates any registered tool input
	 */
	toolInputSchema() {
		const schemas = Array.from(this.tools.values()).map((tool) => {
			const schema = tool.inputSchema;
			if (!(schema instanceof z.ZodObject) || !("tool" in schema.shape)) {
				throw new Error(
					`Tool ${tool.name} schema must be an object with a 'tool' discriminator`,
				);
			}
			return schema;
		});

		if (schemas.length === 0) {
			throw new Error("No tools registered");
		}

		// Type assertion to help TypeScript understand the schema structure
		const unionSchemas = schemas as unknown as [
			z.ZodObject<{ tool: z.ZodLiteral<string> }>,
			...z.ZodObject<{ tool: z.ZodLiteral<string> }>[],
		];

		return z.discriminatedUnion("tool", unionSchemas);
	}
}
