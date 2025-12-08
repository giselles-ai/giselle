import type { FileData, NodeId, OutputId } from "@giselles-ai/protocol";
import type { ToolSet } from "ai";

export type PreparedToolSet = {
	toolSet: ToolSet;
	cleanupFunctions: Array<() => void | Promise<void>>;
};
export interface GenerationMetadata {
	[key: string]: string | number | GenerationMetadata | null | undefined;
}

export type AppEntryResolver = (
	nodeId: NodeId,
	outputId: OutputId,
) => string | number | FileData[] | undefined;

export type * from "./internal/use-generation-executor";
