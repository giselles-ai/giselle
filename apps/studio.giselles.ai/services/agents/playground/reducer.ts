import type { Node, Port } from "../nodes";
import type {
	PlaygroundEdge,
	PlaygroundGraph,
	PlaygroundNode,
	PlaygroundState,
	PlaygroundViewport,
} from "./types";

export type PlaygroundAction =
	| { type: "ADD_NODE"; node: PlaygroundNode }
	| { type: "REMOVE_NODE"; nodeId: PlaygroundNode["id"] }
	| {
			type: "UPDATE_NODE";
			nodeId: PlaygroundNode["id"];
			updates: Partial<Pick<PlaygroundNode, "data" | "name" | "position">>;
	  }
	| { type: "ADD_PORT"; port: Port }
	| { type: "REMOVE_PORT"; portId: Port["id"] }
	| { type: "UPDATE_PORT"; portId: Port["id"]; updates: Partial<Port> }
	| { type: "ADD_EDGE"; edge: PlaygroundEdge }
	| { type: "REMOVE_EDGE"; edgeId: PlaygroundEdge["id"] }
	| { type: "SET_GRAPH"; graph: PlaygroundGraph }
	| { type: "UPDATE_VIEWPORT"; viewport: PlaygroundViewport }
	| {
			type: "SET_AGENT_NAME";
			agentName: string;
	  };

export function playgroundReducer(
	state: PlaygroundState,
	action: PlaygroundAction,
): PlaygroundState {
	switch (action.type) {
		case "ADD_NODE":
			return {
				...state,
				graph: {
					...state.graph,
					nodes: [...state.graph.nodes, { ...action.node }],
				},
			};
		case "REMOVE_NODE":
			return {
				...state,
				graph: {
					...state.graph,
					nodes: state.graph.nodes.filter((node) => node.id !== action.nodeId),
				},
			};
		case "UPDATE_NODE":
			return {
				...state,
				graph: {
					...state.graph,
					nodes: state.graph.nodes.map((node) => {
						if (node.id !== action.nodeId) {
							return node;
						}
						return {
							...node,
							...action.updates,
						};
					}),
				},
			};
		case "ADD_PORT":
			return {
				...state,
				graph: {
					...state.graph,
					nodes: state.graph.nodes.map((node) => {
						if (node.id !== action.port.nodeId) {
							return node;
						}
						return {
							...node,
							ports: [...node.ports, action.port],
						};
					}),
				},
			};
		case "REMOVE_PORT":
			return {
				...state,
				graph: {
					...state.graph,
					nodes: state.graph.nodes.map((node) => ({
						...node,
						ports: node.ports.filter((port) => port.id !== action.portId),
					})),
					edges: state.graph.edges.filter(
						(edge) =>
							edge.sourcePortId !== action.portId &&
							edge.targetPortId !== action.portId,
					),
				},
			};
		case "UPDATE_PORT":
			return {
				...state,
				graph: {
					...state.graph,
					nodes: state.graph.nodes.map((node) => ({
						...node,
						ports: node.ports.map((port) =>
							port.id === action.portId ? { ...port, ...action.updates } : port,
						),
					})),
				},
			};
		case "ADD_EDGE":
			return {
				...state,
				graph: {
					...state.graph,
					edges: [...state.graph.edges, action.edge],
				},
			};
		case "REMOVE_EDGE":
			return {
				...state,
				graph: {
					...state.graph,
					edges: state.graph.edges.filter((edge) => edge.id !== action.edgeId),
				},
			};
		case "SET_GRAPH":
			return {
				...state,
				graph: action.graph,
			};
		case "UPDATE_VIEWPORT":
			return {
				...state,
				graph: {
					...state.graph,
					viewport: action.viewport,
				},
			};
		case "SET_AGENT_NAME":
			return {
				...state,
				agent: {
					...state.agent,
					name: action.agentName,
				},
			};
		default:
			return state;
	}
}
