import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { ToolProvider } from "./common";
import { githubConfig } from "./provider-config";

export function GitHubToolConfigurationDialog({
	node,
}: { node: TextGenerationNode }) {
	return <ToolProvider node={node} config={githubConfig} />;
}
