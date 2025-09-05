import type { TextGenerationNode, ToolSet } from "@giselle-sdk/data-type";
import { DatabaseIcon, GlobeIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GitHubIcon } from "../../../../../icons";
import { AnthropicWebSearchToolConfigurationDialog } from "./anthropic-web-search";
import { GitHubToolConfigurationDialog } from "./github";
import { PostgresToolConfigurationDialog } from "./postgres";

interface ToolProviderDescriptor {
	key: keyof ToolSet;
	label: string;
	icon: ReactNode;
	renderConfiguration: (node: TextGenerationNode) => ReactNode;
	requirement?: (node: TextGenerationNode) => boolean;
}

export const toolProviders: ToolProviderDescriptor[] = [
	{
		key: "github",
		label: "GitHub",
		icon: <GitHubIcon data-tool-icon />,
		renderConfiguration: (node) => (
			<GitHubToolConfigurationDialog node={node} />
		),
	},
	{
		key: "postgres",
		label: "PostgreSQL",
		icon: <DatabaseIcon data-tool-icon />,
		renderConfiguration: (node) => (
			<PostgresToolConfigurationDialog node={node} />
		),
	},
	{
		key: "anthropicWebSearch",
		label: "Anthropic Web Search",
		icon: <GlobeIcon data-tool-icon />,
		renderConfiguration: (node) => (
			<AnthropicWebSearchToolConfigurationDialog node={node} />
		),
		requirement: (_node) => false, // Hidden - now managed in model panel
	},
];
