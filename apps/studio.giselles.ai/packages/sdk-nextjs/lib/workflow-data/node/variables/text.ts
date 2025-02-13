import { z } from "zod";
import { BaseNodeData, nodeId } from "../types";

export const TextContent = z.object({
	type: z.literal("text"),
	text: z.string(),
});
type TextContent = z.infer<typeof TextContent>;

export const TextNodeData = BaseNodeData.extend({
	type: z.literal("variable"),
	content: TextContent,
});
type TextNodeData = z.infer<typeof TextNodeData>;

export const CreateTextNodeParams = TextContent.omit({
	type: true,
})
	.partial()
	.extend({
		name: z.string(),
	});

export function isTextNode(node: {
	type: string;
	content: unknown;
}): node is { type: "variable"; content: TextContent } {
	return (
		node.type === "variable" && (node.content as TextContent).type === "text"
	);
}

export function createTextNodeData(
	params: z.infer<typeof CreateTextNodeParams>,
): z.infer<typeof TextNodeData> {
	return {
		id: nodeId.generate(),
		name: params.name,
		type: "variable",
		content: {
			type: "text",
			text: params.text ?? "",
		},
	};
}
