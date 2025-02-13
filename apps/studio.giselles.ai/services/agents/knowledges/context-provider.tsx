// import {
// 	type FC,
// 	type PropsWithChildren,
// 	useCallback,
// 	useEffect,
// 	useReducer,
// } from "react";
// import type { AgentId } from "../types";
// // import { getKnowledges } from "./actions/get-knowledges-from-db";
// import { KnowledgeContext } from "./context";
// import {
// 	type AsyncKnowledgeAction,
// 	type KnowledgeAction,
// 	knowledgeReducer,
// } from "./reducer";

// export const fetchKnowledges = (agentId: AgentId): AsyncKnowledgeAction => {
// 	return async (dispatch) => {
// 		dispatch({ type: "SET_LOADING" });
// 		// const knowledges = await getKnowledges(agentId);
// 		// dispatch({ type: "SET_KNOWLEDGES", knowledges });
// 	};
// };

// type KnowledgeContextProviderProps = {
// 	agentId: AgentId;
// };
// export const KnowledgeContextProvider: FC<
// 	PropsWithChildren<KnowledgeContextProviderProps>
// > = ({ children, agentId }) => {
// 	const [state, dispatchSync] = useReducer(knowledgeReducer, {
// 		isLoading: false,
// 		knowledges: [],
// 	});
// 	const dispatch = useCallback(
// 		(action: KnowledgeAction | AsyncKnowledgeAction) => {
// 			if (typeof action === "function") {
// 				action(dispatch);
// 			} else {
// 				dispatchSync(action);
// 			}
// 		},
// 		[],
// 	);

// 	useEffect(() => {
// 		dispatch(fetchKnowledges(agentId));
// 	}, [agentId, dispatch]);
// 	return (
// 		<KnowledgeContext.Provider
// 			value={{
// 				state,
// 				dispatch,
// 			}}
// 		>
// 			{children}
// 		</KnowledgeContext.Provider>
// 	);
// };
