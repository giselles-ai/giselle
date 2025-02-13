import type { TextNodeData } from "./text";
import type { TextGenerationNodeData } from "./text-generation";

// Base types
export type NodeId = `nd_${string}`;
export type ConnectionHandleId = `hndl_${string}`;

export interface Position {
	x: number;
	y: number;
}

export interface ConnectionHandle {
	id: ConnectionHandleId;
	connectedSourceNodeId: NodeId;
	connectedTargetNodeId: NodeId;
	label: string;
}

export interface NodeUIState {
	position: Position;
	selected: boolean;
}

export interface NodeServices {
	addSources(nodes: NodeData[]): void;
	removeSources(nodes: NodeData[]): void;
}

// Base node interface
export interface BaseNode {
	id: NodeId;
	name: string;
	type: string;
}

// Union type of all node types
export type NodeData = TextGenerationNodeData | TextNodeData;
