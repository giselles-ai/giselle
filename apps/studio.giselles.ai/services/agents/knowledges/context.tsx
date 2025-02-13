// import { type Dispatch, createContext, useContext } from "react";
// import type { AsyncKnowledgeAction, KnowledgeAction } from "./reducer";
// import type { KnowledgeState } from "./types";

// export type KnowledgeContext = {
// 	dispatch: Dispatch<KnowledgeAction | AsyncKnowledgeAction>;
// 	state: KnowledgeState;
// };

// export const KnowledgeContext = createContext<KnowledgeContext>({
// 	dispatch: () => {},
// 	state: {
// 		knowledges: [],
// 		isLoading: true,
// 	},
// });

// export const useKnowledges = () => {
// 	const context = useContext(KnowledgeContext);
// 	if (context === undefined) {
// 		throw new Error("useKnowledge must be used within a KnowledgeProvider");
// 	}
// 	return context;
// };
