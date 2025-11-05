import z from "zod/v4";
import { ActionBase, ActionCommandBase } from "./base";
import { actionMetadataRegistory } from "./meta";

const WebSearchActionCommand = ActionCommandBase.extend({
	id: z.literal("web-search.fetch"),
	parameters: z.object({
		url: z.url(),
	}),
});

actionMetadataRegistory.add(WebSearchActionCommand, {
	label: "Web search",
});
export const WebSearchAction = ActionBase.extend({
	provider: z.literal("web-search"),
	command: z.union([WebSearchActionCommand]),
});

export const WebSearchActionCommandId = z.union(
	WebSearchAction.shape.command.options.map((option) => option.shape.id),
);
export type WebSearchActionCommandId = z.infer<typeof WebSearchActionCommandId>;
