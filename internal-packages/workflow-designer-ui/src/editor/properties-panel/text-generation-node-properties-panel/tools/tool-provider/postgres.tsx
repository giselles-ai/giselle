import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { ToolProvider } from "./common";
import { postgresConfig } from "./provider-config";

export function PostgresToolConfigurationDialog({
	node,
}: { node: TextGenerationNode }) {
	return <ToolProvider node={node} config={postgresConfig} />;
}
