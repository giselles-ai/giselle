import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { octokit } from "@giselles-ai/github-tool";
import { getLanguageModelTool } from "@giselles-ai/language-model-registry";
import type { GiselleLogger } from "@giselles-ai/logger";
import type { ContentGenerationContent } from "@giselles-ai/protocol";
import { SecretId } from "@giselles-ai/protocol";
import type { ToolSet } from "ai";
import z from "zod/v4";
import { decryptSecret } from "../../../secrets";
import type { GiselleContext } from "../../../types";
import { createGitHubTools } from "./github";
import { createPostgresTool } from "./postgres";

export async function buildToolSet({
	context,
	logger,
	generationId,
	nodeId,
	tools,
}: {
	context: GiselleContext;
	logger: GiselleLogger;
	generationId: string;
	nodeId: string;
	tools: ContentGenerationContent["tools"];
}): Promise<ToolSet> {
	const toolSet: ToolSet = {};
	for (const tool of tools) {
		const languageModelTool = getLanguageModelTool(tool.name);
		switch (languageModelTool.name) {
			case "anthropic-web-search":
				{
					const configurationOptionSchema = z.object({
						allowedDomains:
							languageModelTool.configurationOptions.allowedDomains.schema,
						blockedDomains:
							languageModelTool.configurationOptions.blockedDomains.schema,
						maxUses: languageModelTool.configurationOptions.maxUses.schema,
					});
					const result = configurationOptionSchema.safeParse(
						tool.configuration,
					);
					if (!result.success) {
						logger.warn(
							`${generationId}, ${nodeId}, anthropic-web-search tool configuration is invalid: ${result.error.message}`,
						);
						continue;
					}
					const anthropicWebSearchConfiguration = result.data;
					toolSet.web_search = anthropic.tools.webSearch_20250305({
						maxUses: anthropicWebSearchConfiguration.maxUses,
						allowedDomains: anthropicWebSearchConfiguration.allowedDomains,
						blockedDomains: anthropicWebSearchConfiguration.blockedDomains,
					});
				}
				break;
			case "github-api": {
				const unsafeSecretId =
					tool.configuration[
						languageModelTool.configurationOptions.secretId.name
					];
				const result = SecretId.safeParse(unsafeSecretId);
				if (result.error) {
					logger.warn(
						`${generationId}, ${nodeId}, github-api tool secret id is undefined`,
					);
					continue;
				}
				const unsafeToken = await decryptSecret({
					context,
					secretId: result.data,
				});
				if (unsafeToken === undefined) {
					logger.warn(
						`${generationId}, ${nodeId}, github-api tool secret token is undefined`,
					);
					continue;
				}
				const token = unsafeToken;
				const useTools =
					tool.configuration[
						languageModelTool.configurationOptions.useTools.name
					];
				if (!Array.isArray(useTools)) {
					logger.warn(
						`${generationId}, ${nodeId}, github-api tool use tools is not an array`,
					);
					continue;
				}

				const app = octokit({
					strategy: "personal-access-token",
					personalAccessToken: token,
				});

				const githubTools = createGitHubTools(
					app,
					languageModelTool.tools,
					useTools,
				);
				Object.assign(toolSet, githubTools);
				break;
			}
			case "google-web-search":
				toolSet.google_search = google.tools.googleSearch({});
				break;
			case "openai-web-search": {
				const configurationOptionSchema = z.object({
					allowedDomains:
						languageModelTool.configurationOptions.allowedDomains.schema,
				});
				const result = configurationOptionSchema.safeParse(tool.configuration);
				if (!result.success) {
					logger.warn(
						`${generationId}, ${nodeId}, openai-web-search tool configuration is invalid: ${result.error.message}`,
					);
					continue;
				}
				toolSet.web_search = openai.tools.webSearch(
					result.data.allowedDomains
						? { filters: { allowedDomains: result.data.allowedDomains } }
						: {},
				);
				break;
			}
			case "postgres": {
				const unsafeSecretId =
					tool.configuration[
						languageModelTool.configurationOptions.secretId.name
					];
				const result = SecretId.safeParse(unsafeSecretId);
				if (result.error) {
					logger.warn(
						`${generationId}, ${nodeId}, postgres tool secret id is undefined`,
					);
					continue;
				}
				const unsafeToken = await decryptSecret({
					context,
					secretId: result.data,
				});
				if (unsafeToken === undefined) {
					logger.warn(
						`${generationId}, ${nodeId}, postgres tool secret token is undefined`,
					);
					continue;
				}
				const connectionString = unsafeToken;
				const useTools =
					tool.configuration[
						languageModelTool.configurationOptions.useTools.name
					];
				if (!Array.isArray(useTools)) {
					logger.warn(
						`${generationId}, ${nodeId}, postgres tool use tools is not an array`,
					);
					continue;
				}
				const postgresTools = createPostgresTool({
					connectionString,
					useTools,
					toolDefs: languageModelTool.tools,
					context,
				});

				Object.assign(toolSet, postgresTools);
				break;
			}
			default: {
				const _exhaustiveCheck: never = languageModelTool;
				throw new Error(`Unknown tool: ${_exhaustiveCheck}`);
			}
		}
	}
	return toolSet;
}
