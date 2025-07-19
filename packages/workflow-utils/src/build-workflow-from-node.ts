import {
	type NodeLike,
	WorkflowId,
	type Workspace,
} from "@giselle-sdk/data-type";
import { buildSequenceList } from "./helper";
import { sliceGraphFromNode } from "./slice-graph-from-node";

export function buildWorkflowFromNode(
	node: NodeLike,
	graph: Pick<Workspace, "connections" | "nodes">,
) {
	const { nodes, connections } = sliceGraphFromNode(node, graph);

	const workflowId = WorkflowId.generate();

	const sequenceList = buildSequenceList(nodes, connections, workflowId);

	return {
		id: workflowId,
		sequences: sequenceList,
		nodes: nodes,
	};
}
