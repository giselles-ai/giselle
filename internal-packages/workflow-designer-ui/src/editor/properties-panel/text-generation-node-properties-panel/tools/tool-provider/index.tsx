import type { TextGenerationNode, ToolSet } from "@giselle-sdk/data-type";
import { DatabaseIcon } from "lucide-react";
import type { ReactNode } from "react";
import { GitHubIcon } from "../../../../../icons";
import { GitHubToolConfigurationDialog } from "./github";
import { PostgresToolConfigurationDialog } from "./postgres";

interface ToolProviderDescriptor {
	key: keyof ToolSet;
	label: string;
	icon: ReactNode;
	renderConfiguration: (node: TextGenerationNode) => ReactNode;
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
];
