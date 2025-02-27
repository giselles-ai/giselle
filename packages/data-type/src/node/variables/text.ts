import { z } from "zod";
import { NodeBase } from "../base";

export const TextContent = z.object({
	type: z.literal("text"),
	text: z.string(),
});
type TextContent = z.infer<typeof TextContent>;

export const TextNode = NodeBase.extend({
	type: z.literal("variable"),
	content: TextContent,
});
type TextNode = z.infer<typeof TextNode>;

export const CreateTextNodeParams = TextContent.omit({
	type: true,
})
	.partial()
	.extend({
		name: z.string(),
	});

export function isTextNode(args: unknown): args is TextNode {
	const result = TextNode.safeParse(args);
	return result.success;
}

export const TextContentReference = z.object({
	type: TextContent.shape.type,
});
export type TextContentReference = z.infer<typeof TextContentReference>;
