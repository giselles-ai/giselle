import {
	type Connection,
	type ConnectionId,
	type NodeId,
	type NodeLike,
	type Workflow,
	WorkflowId,
} from "@giselle-sdk/data-type";
import {
	createConnectedNodeIdMap,
	createJobMap,
	findConnectedConnectionMap,
	findConnectedNodeMap,
} from "./helper";

export function buildWorkflowMap(
	nodeMap: Map<NodeId, NodeLike>,
	connectionMap: Map<ConnectionId, Connection>,
) {
	const workflowSet = new Set<Workflow>();
	let processedNodes: NodeId[] = [];

	const connectedNodeIdMap = createConnectedNodeIdMap(
		new Set(connectionMap.values()),
		new Set(nodeMap.keys()),
	);
	for (const [nodeId, node] of nodeMap) {
		if (node.type !== "operation") continue;
		if (processedNodes.includes(nodeId)) continue;
		const connectedNodeMap = findConnectedNodeMap(
			nodeId,
			nodeMap,
			connectedNodeIdMap,
		);
		const connectedConnectionMap = findConnectedConnectionMap(
			new Set(connectedNodeMap.keys()),
			new Set(connectionMap.values()),
		);
		const workflowId = WorkflowId.generate();
		const jobSet = createJobMap(
			new Set(connectedNodeMap.values()),
			new Set(connectedConnectionMap.values()),
			workflowId,
		);
		workflowSet.add({
			id: WorkflowId.generate(),
			jobs: Array.from(jobSet.values()),
			nodes: Array.from(connectedNodeMap.values()),
		});

		processedNodes = [...processedNodes, ...connectedNodeMap.keys()];
	}
	const workflowMap = new Map<WorkflowId, Workflow>();
	for (const workflow of workflowSet) {
		workflowMap.set(workflow.id, workflow);
	}
	return workflowMap;
}
