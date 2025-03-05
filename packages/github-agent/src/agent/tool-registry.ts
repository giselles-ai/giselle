import type { Octokit } from "@octokit/core";
import { RequestError } from "@octokit/request-error";
import { z } from "zod";
import { graphqlTool } from "./tools/graphql.js";
import {
	getFileContentsTool,
	getIssueTool,
	getPullRequestCommentsTool,
	getPullRequestDiffTool,
	getPullRequestFilesTool,
	getPullRequestReviewsTool,
	getPullRequestStatusTool,
	getPullRequestTool,
	listCommitsTool,
	listIssuesTool,
	listPullRequestsTool,
} from "./tools/read.js";
import { restTool } from "./tools/rest.js";
import {
	searchCodeTool,
	searchIssuesTool,
	searchRepositoriesTool,
	searchUsersTool,
} from "./tools/search.js";

const allTools = [
	getFileContentsTool,
	getIssueTool,
	getPullRequestCommentsTool,
	getPullRequestDiffTool,
	getPullRequestFilesTool,
	getPullRequestReviewsTool,
	getPullRequestStatusTool,
	getPullRequestTool,
	listCommitsTool,
	listIssuesTool,
	listPullRequestsTool,
	searchCodeTool,
	searchIssuesTool,
	searchRepositoriesTool,
	searchUsersTool,
	graphqlTool,
	restTool,
] as const;

export type AvailableToolName = (typeof allTools)[number]["name"];
export type AvailableTool = (typeof allTools)[number];
type ToolByName<TName extends string> = Extract<AvailableTool, { name: TName }>;

const toolMap: Map<AvailableToolName, AvailableTool> = new Map(
	allTools.map((tool) => [tool.name, tool]),
);

function isAvailableToolName(name: string): name is AvailableToolName {
	return Array.from(toolMap.keys()).includes(name as AvailableToolName);
}

export function getToolByName(name: string): AvailableTool | undefined {
	if (!isAvailableToolName(name)) {
		return undefined;
	}
	return toolMap.get(name);
}

export function getAllToolNames(): AvailableToolName[] {
	return Array.from(toolMap.keys());
}

// Error classes for tool registry
export class ToolNotFoundError extends Error {
	constructor(toolName: string) {
		super(`Tool "${toolName}" not found`);
		this.name = "ToolNotFoundError";
	}
}

export class NoToolsRegisteredError extends Error {
	constructor() {
		super("No tools registered");
		this.name = "NoToolsRegisteredError";
	}
}

// MARK: Tool registry
export class ToolRegistry {
	private tools = new Map<string, AvailableTool>();
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

	register(tool: AvailableTool): void {
		this.tools.set(tool.name, tool);
	}

	registerByNames(
		toolNames: string[],
		toolResolver: (name: string) => AvailableTool | undefined,
	): void {
		if (toolNames.length === 0) {
			throw new NoToolsRegisteredError();
		}

		const notFoundTools: string[] = [];

		for (const name of toolNames) {
			const tool = toolResolver(name);
			if (!tool) {
				notFoundTools.push(name);
				continue;
			}
			this.register(tool);
		}

		if (notFoundTools.length > 0) {
			throw new ToolNotFoundError(notFoundTools.join(", "));
		}
	}

	getTool<TName extends AvailableToolName>(
		name: TName,
	): ToolByName<TName> | undefined {
		const tool = this.tools.get(name);
		return tool as ToolByName<TName> | undefined;
	}

	async dispatchTool(rawInput: unknown): Promise<unknown> {
		const validated = this.toolInputSchema().parse(rawInput);

		const tool = this.tools.get(validated.tool);
		if (!tool) {
			throw new ToolNotFoundError(validated.tool);
		}
		try {
			return await this.withRetry(() => {
				return (
					tool.execute as (
						octokit: Octokit,
						input: typeof validated,
					) => Promise<unknown>
				)(this.octokit, validated);
			});
		} catch (error) {
			throw new Error(
				`Invalid input for tool ${validated.tool}: ${error instanceof Error ? error.message : error}`,
			);
		}
	}

	generateToolDescriptions(): string {
		let descriptions = "";
		for (const tool of this.tools.values()) {
			descriptions += "<tool>\n";
			descriptions += `<name>${tool.name}</name>\n`;
			descriptions += `<purpose>${tool.purpose}</purpose>\n`;
			descriptions += `<description>${tool.description}</description>\n`;
			if (tool.constraints && tool.constraints.length > 0) {
				descriptions += "<constraints>\n";
				for (const constraint of tool.constraints) {
					descriptions += `<constraint>${constraint}</constraint>\n`;
				}
				descriptions += "</constraints>\n";
			}
			descriptions += "</tool>\n\n";
		}
		return `<tools>\n${descriptions}</tools>`;
	}

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
			throw new NoToolsRegisteredError();
		}

		if (schemas.length === 1) {
			return schemas[0];
		}

		return z.discriminatedUnion("tool", [
			schemas[0],
			schemas[1],
			...schemas.slice(2),
		]);
	}
}
