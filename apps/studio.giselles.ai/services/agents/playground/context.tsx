"use client";

import {
	type Dispatch,
	type FC,
	type PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useReducer,
} from "react";
import { setAgentName } from "../actions/set-agent-name";
import type { Knowledge } from "../knowledges";
import { OperationProvider } from "../nodes";
import { RequestProvider } from "../requests/provider";
import type { RequestRunnerProvider } from "../requests/types";
import type { AgentId } from "../types";
import { setGraph } from "./actions/set-graph";
import { type PlaygroundAction, playgroundReducer } from "./reducer";
import type {
	PlaygroundGraph,
	PlaygroundOption,
	PlaygroundState,
} from "./types";
import { useDebounce } from "./use-debounce";

type PlaygroundContext = {
	dispatch: Dispatch<PlaygroundAction>;
	state: PlaygroundState;
};

const PlaygroundContext = createContext<PlaygroundContext | undefined>(
	undefined,
);

export type PlaygroundProviderProps = {
	agentId: AgentId;
	name: string | null;
	graph: PlaygroundGraph;
	requestRunnerProvider: RequestRunnerProvider;
	knowledges: Knowledge[];
	options: PlaygroundOption[];
};
export const PlaygroundProvider: FC<
	PropsWithChildren<PlaygroundProviderProps>
> = (props) => {
	const [state, dispatch] = useReducer(playgroundReducer, {
		agentId: props.agentId,
		agent: {
			id: props.agentId,
			name: props.name,
		},
		graph: props.graph,
		knowledges: props.knowledges,
		options: props.options,
	});
	const debounceSetGraph = useDebounce(
		async (agentId: AgentId, graph: PlaygroundGraph) => {
			await setGraph(agentId, graph);
		},
		1000,
	);

	const dispatchWithMiddleware = useCallback(
		async (action: PlaygroundAction) => {
			dispatch(action);
			if (action.type !== "SET_AGENT_NAME") {
				debounceSetGraph(props.agentId, playgroundReducer(state, action).graph);
			} else {
				await setAgentName({
					agentId: props.agentId,
					name: action.agentName,
				});
			}
		},
		[state, debounceSetGraph, props.agentId],
	);

	return (
		<PlaygroundContext.Provider
			value={{
				dispatch: dispatchWithMiddleware,
				state,
			}}
		>
			<OperationProvider
				addPort={(port) => {
					dispatchWithMiddleware({ type: "ADD_PORT", port });
				}}
				updatePort={(portId, updates) => {
					dispatchWithMiddleware({ type: "UPDATE_PORT", portId, updates });
				}}
				deletePort={(portId) => {
					dispatchWithMiddleware({ type: "REMOVE_PORT", portId });
				}}
				updateNode={(nodeId, updates) => {
					dispatchWithMiddleware({ type: "UPDATE_NODE", nodeId, updates });
				}}
				knowledges={props.knowledges}
			>
				<RequestProvider
					agentId={props.agentId}
					onBeforeRequestStartAction={async () => {
						await setGraph(state.agentId, state.graph);
					}}
				>
					{props.children}
				</RequestProvider>
			</OperationProvider>
		</PlaygroundContext.Provider>
	);
};

export const usePlayground = () => {
	const context = useContext(PlaygroundContext);
	if (context === undefined) {
		throw new Error("useGraph must be used within a GraphProvider");
	}
	return context;
};
