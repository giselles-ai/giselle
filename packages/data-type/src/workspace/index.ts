import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod";
import { Connection } from "../connection";
import { Node, NodeId, NodeUIState } from "../node";
import { OpenAIVecrtorStore } from "../openai";
import { Workflow } from "../workflow";

export const WorkspaceId = createIdGenerator("wrks");
export type WorkspaceId = z.infer<typeof WorkspaceId.schema>;

export const WorkspaceProviderOptionOpenAI = z.object({
	vectorStore: OpenAIVecrtorStore,
});
export const WorkspaceProviderOptions = z.object({
	openai: z.optional(WorkspaceProviderOptionOpenAI),
});

export const WorkspaceSchemaVersion = z.enum(["20250221"]);
export const Viewport = z.object({
	x: z.number(),
	y: z.number(),
	zoom: z.number(),
});
export type Viewport = z.infer<typeof Viewport>;
export const UIState = z.object({
	nodeState: z.record(NodeId.schema, NodeUIState),
	viewport: Viewport,
});
export type UIState = z.infer<typeof UIState>;

export const Workspace = z.object({
	id: WorkspaceId.schema,
	name: z.string().optional(),
	schemaVersion: WorkspaceSchemaVersion,
	nodes: z.array(Node),
	connections: z.array(Connection),
	ui: UIState,
	editingWorkflows: z.array(Workflow),
	providerOptions: z.optional(WorkspaceProviderOptions),
});
export type Workspace = z.infer<typeof Workspace>;

export function generateInitialWorkspace() {
	return {
		id: WorkspaceId.generate(),
		schemaVersion: "20250221",
		nodes: [],
		connections: [],
		ui: {
			nodeState: {},
			viewport: {
				x: 0,
				y: 0,
				zoom: 1,
			},
		},
		editingWorkflows: [],
	} satisfies Workspace;
}
