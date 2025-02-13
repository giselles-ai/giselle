import type { Viewport, XYPosition } from "@xyflow/react";
import type { Knowledge } from "../knowledges";
import type { Node, NodeGraph, Port } from "../nodes";
import type { AgentId } from "../types";

export type PlaygroundNode = NodeGraph & { position: XYPosition };

export type PlaygroundEdge = {
	id: `ed_${string}`;
	sourceNodeId: Node["id"];
	sourcePortId: Port["id"];
	targetNodeId: Node["id"];
	targetPortId: Port["id"];
};

export type PlaygroundViewport = Viewport;
export type PlaygroundGraph = {
	nodes: PlaygroundNode[];
	edges: PlaygroundEdge[];
	viewport: PlaygroundViewport;
};

export const playgroundOption = {
	webscraping: "webscraping",
} as const;

export type PlaygroundOption = keyof typeof playgroundOption;

export type PlaygroundState = {
	agentId: AgentId;
	agent: { name: string | null; id: AgentId };
	graph: PlaygroundGraph;
	knowledges: Knowledge[];
	options: PlaygroundOption[];
};
