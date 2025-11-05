import { NodeId } from "@giselle-ai/protocol";

export function isNodeId(data: unknown): data is NodeId {
	const nodeId = NodeId.safeParse(data);
	return nodeId.success;
}
