import { NodeId } from "@giselle-ai/data-type";

export function isNodeId(data: unknown): data is NodeId {
	const nodeId = NodeId.safeParse(data);
	return nodeId.success;
}
