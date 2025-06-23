import { z } from "zod/v4";
import { NodeBase, NodeReferenceBase } from "../base";
import { FileContent, FileContentReference } from "./file";
import { GitHubContent, GitHubContentReference } from "./github";
import { TextContent, TextContentReference } from "./text";
import {
	VectorStoreContent,
	VectorStoreContentReference,
} from "./vector-store";
import { WebPageContent, WebPageContentReference } from "./web-page";
export * from "./file";
export * from "./github";
export * from "./text";
export * from "./vector-store";
export * from "./web-page";

const VariableNodeContent = z.discriminatedUnion("type", [
	TextContent,
	FileContent,
	GitHubContent,
	VectorStoreContent,
	WebPageContent,
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
			VectorStoreContent.shape.type,
			WebPageContent.shape.type,
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

export const WebPageNode = VariableNode.extend({
	content: WebPageContent,
});
export type WebPageNode = z.infer<typeof WebPageNode>;

export function isWebPageNode(args: unknown): args is WebPageNode {
	const result = WebPageNode.safeParse(args);
	return result.success;
}

export const VectorStoreNode = VariableNode.extend({
	content: VectorStoreContent,
});
export type VectorStoreNode = z.infer<typeof VectorStoreNode>;

type VectorStoreSourceProvider = VectorStoreContent["source"]["provider"];

export function isVectorStoreNode<
	TVectorStoreSourceProvider extends
		VectorStoreSourceProvider = VectorStoreSourceProvider,
>(
	args: unknown,
	provider?: TVectorStoreSourceProvider,
): args is TVectorStoreSourceProvider extends VectorStoreSourceProvider
	? VectorStoreNode & {
			content: { source: { provider: TVectorStoreSourceProvider } };
		}
	: VectorStoreNode {
	const result = VectorStoreNode.safeParse(args);
	return (
		result.success &&
		(provider === undefined || result.data.content.source.provider === provider)
	);
}

const VariableNodeContentReference = z.discriminatedUnion("type", [
	FileContentReference,
	TextContentReference,
	GitHubContentReference,
	VectorStoreContentReference,
	WebPageContentReference,
]);

export const VariableNodeReference = NodeReferenceBase.extend({
	type: VariableNode.shape.type,
	content: VariableNodeContentReference,
});
export type VariableNodeReference = z.infer<typeof VariableNodeReference>;
