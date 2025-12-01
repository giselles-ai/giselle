import type { LanguageModelToolName } from "@giselles-ai/language-model-registry";
import type { ContentGenerationNode, ToolSet } from "@giselles-ai/protocol";
import { DatabaseIcon, GlobeIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GitHubIcon } from "../../../../../icons";
import { AnthropicWebSearchToolConfigurationDialog } from "./anthropic-web-search";
import { GitHubToolConfigurationDialog } from "./github";
import { PostgresToolConfigurationDialog } from "./postgres";

interface ToolProviderDescriptor {
	toolName: LanguageModelToolName;
	label: string;
	icon: ReactNode;
	renderConfiguration: (node: ContentGenerationNode) => ReactNode;
	requirement?: (node: ContentGenerationNode) => boolean;
}

export const toolProviders: ToolProviderDescriptor[] = [
	{
		toolName: "github-api",
		label: "GitHub",
		icon: <GitHubIcon data-tool-icon />,
		renderConfiguration: (node) => (
			<GitHubToolConfigurationDialog node={node} />
		),
	},
	// {
	// 	key: "postgres",
	// 	label: "PostgreSQL",
	// 	icon: <DatabaseIcon data-tool-icon />,
	// 	renderConfiguration: (node) => (
	// 		<PostgresToolConfigurationDialog node={node} />
	// 	),
	// },
	// {
	// 	key: "anthropicWebSearch",
	// 	label: "Anthropic Web Search",
	// 	icon: <GlobeIcon data-tool-icon />,
	// 	renderConfiguration: (node) => (
	// 		<AnthropicWebSearchToolConfigurationDialog node={node} />
	// 	),
	// 	requirement: (node) => node.content.languageModel.provider === "anthropic",
	// },
];
