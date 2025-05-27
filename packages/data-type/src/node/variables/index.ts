import { z } from "zod/v4";
import { NodeBase, NodeReferenceBase, OverrideNodeBase } from "../base";
import { FileContent, FileContentReference, OverrideFileContent } from "./file";
import {
	GitHubContent,
	GitHubContentReference,
	OverrideGitHubContent,
} from "./github";
import { OverrideTextContent, TextContent, TextContentReference } from "./text";
export * from "./file";
export * from "./text";
export * from "./github";

const VariableNodeContent = z.discriminatedUnion("type", [
	TextContent,
	FileContent,
	GitHubContent,
]);

export const VariableNode = NodeBase.extend({
	type: z.literal("variable"),
	content: VariableNodeContent,
});
export type VariableNode = z.infer<typeof VariableNode>;

export const VariableNodeLike = NodeBase.extend({
	type: z.literal("variable"),
	content: z.looseObject({
		type: z.union([
			TextContent.shape.type,
			FileContent.shape.type,
			GitHubContent.shape.type,
		]),
	}),
});
export type VariableNodeLike = z.infer<typeof VariableNodeLike>;

export const TextNode = VariableNode.extend({
	content: TextContent,
});
export type TextNode = z.infer<typeof TextNode>;

export function isTextNode(args: unknown): args is TextNode {
	const result = TextNode.safeParse(args);
	return result.success;
}

export const FileNode = VariableNode.extend({
	content: FileContent,
});
export type FileNode = z.infer<typeof FileNode>;

export function isFileNode(args: unknown): args is FileNode {
	const result = FileNode.safeParse(args);
	return result.success;
}

export const GitHubNode = VariableNode.extend({
	content: GitHubContent,
});
export type GitHubNode = z.infer<typeof GitHubNode>;

export function isGitHubNode(args: unknown): args is GitHubNode {
	const result = GitHubNode.safeParse(args);
	return result.success;
}

const OverrideVariableNodeContent = z.discriminatedUnion("type", [
	OverrideFileContent,
	OverrideGitHubContent,
	OverrideTextContent,
]);
export const OverrideVariableNode = OverrideNodeBase.extend({
	type: VariableNode.shape.type,
	content: OverrideVariableNodeContent,
});
export type OverrideVariableNode = z.infer<typeof OverrideVariableNode>;

const VariableNodeContentReference = z.discriminatedUnion("type", [
	FileContentReference,
	TextContentReference,
	GitHubContentReference,
]);

export const VariableNodeReference = NodeReferenceBase.extend({
	type: VariableNode.shape.type,
	content: VariableNodeContentReference,
});
export type VariableNodeReference = z.infer<typeof VariableNodeReference>;
