import { z } from "zod/v4";
import { Connection } from "../connection";
import { NodeId, NodeLike, NodeUIState } from "../node";
import { WorkspaceId } from "./id";

export { WorkspaceId } from "./id";

export const WorkspaceSchemaVersion = z.enum(["20250221"]);
export const Viewport = z.object({
	x: z.number(),
	y: z.number(),
	zoom: z.number(),
});
export type Viewport = z.infer<typeof Viewport>;

export const FocusedArea = z.enum(["canvas", "properties-panel", "none"]);
export type FocusedArea = z.infer<typeof FocusedArea>;

export const UIState = z.object({
	nodeState: z.record(NodeId.schema, NodeUIState),
	viewport: Viewport,
	focusedArea: FocusedArea.optional().default("canvas"),
});
export type UIState = z.infer<typeof UIState>;

export const Workspace = z.object({
	id: WorkspaceId.schema,
	name: z.string().optional(),
	schemaVersion: WorkspaceSchemaVersion,
	nodes: z.array(NodeLike),
	connections: z.array(Connection),
	ui: UIState,
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
			focusedArea: "canvas",
		},
	} satisfies Workspace;
}
