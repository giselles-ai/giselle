import type { CreateTextNodeParams, TextNodeData } from "../node/text";
import type {
	CreateTextGenerationNodeParams,
	TextGenerationNode,
	TextGenerationNodeData,
} from "../node/text-generation";
import type { NodeId, NodeUIState } from "../node/types";
import type { RuntimeConfiguration, WorkflowRunResult } from "../runtime/types";
import type { StorageConfiguration } from "../storage/types";

export interface WorkflowConfiguration {
	storage: StorageConfiguration;
	telemetry?: TelemetryConfiguration;
}

export interface TelemetryConfiguration {
	enabled: boolean;
}

export interface Workflow {
	id: string;
	addTextGenerationNode: (
		params: CreateTextGenerationNodeParams,
		options?: { ui: NodeUIState },
	) => TextGenerationNode;
	addTextNode: (
		params: CreateTextNodeParams,
		options?: { ui: NodeUIState },
	) => TextNodeData;
	load: (workflowId: string) => Promise<Record<NodeId, TextGenerationNodeData>>;
	save: () => Promise<void>;
	getNode: (nodeId: NodeId) => TextGenerationNodeData | undefined;
	run(config?: RuntimeConfiguration): Promise<WorkflowRunResult>;
}
