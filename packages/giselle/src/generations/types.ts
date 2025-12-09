import type { FileData, NodeId, OutputId } from "@giselles-ai/protocol";
import type { DataContent, FilePart, ImagePart, TextPart, ToolSet } from "ai";

export type PreparedToolSet = {
	toolSet: ToolSet;
	cleanupFunctions: Array<() => void | Promise<void>>;
};
export interface GenerationMetadata {
	[key: string]: string | number | GenerationMetadata | null | undefined;
}

export type ResolvedFileData = FileData & { data: DataContent };

export type AppEntryResolver = (
	nodeId: NodeId,
	outputId: OutputId,
) => Promise<(TextPart | FilePart | ImagePart)[]>;

export type * from "./internal/use-generation-executor";
