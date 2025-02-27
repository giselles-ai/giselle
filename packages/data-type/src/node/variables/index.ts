import { z } from "zod";
import { NodeBase, NodeReferenceBase } from "../base";
import { FileContent, FileContentReference } from "./file";
import { TextContent, TextContentReference } from "./text";
export * from "./file";
export * from "./text";

const VariableNodeContent = z.discriminatedUnion("type", [
	TextContent,
	FileContent,
]);

export const VariableNode = NodeBase.extend({
	type: z.literal("variable"),
	content: VariableNodeContent,
});
export type VariableNode = z.infer<typeof VariableNode>;

export const TextNode = VariableNode.extend({
	content: TextContent,
});
export type TextNode = z.infer<typeof TextNode>;

export const FileNode = VariableNode.extend({
	content: FileContent,
});
export type FileNode = z.infer<typeof FileNode>;

const VariableNodeContentReference = z.discriminatedUnion("type", [
	FileContentReference,
	TextContentReference,
]);

export const VariableNodeReference = NodeReferenceBase.extend({
	type: VariableNode.shape.type,
	content: VariableNodeContentReference,
});
export type VariableNodeReference = z.infer<typeof VariableNodeReference>;
