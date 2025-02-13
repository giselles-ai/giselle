// import type {
// 	Knowledge,
// 	KnowledgeContent,
// 	KnowledgeContentId,
// 	KnowledgeId,
// 	KnowledgeState,
// } from "./types";

// export type KnowledgeAction =
// 	| { type: "SET_KNOWLEDGES"; knowledges: Knowledge[] }
// 	| { type: "ADD_KNOWLEDGE"; knowledge: Knowledge }
// 	| {
// 			type: "UPDATE_KNOWLEDGE";
// 			knowledgeId: KnowledgeId;
// 			updates: Partial<Knowledge>;
// 	  }
// 	| {
// 			type: "ADD_CONTENT";
// 			knowledgeId: KnowledgeId;
// 			content: KnowledgeContent;
// 	  }
// 	| {
// 			type: "REMOVE_CONTENT";
// 			knowledgeId: KnowledgeId;
// 			contentId: KnowledgeContentId;
// 	  }
// 	| {
// 			type: "SET_LOADING";
// 	  };

// export type AsyncKnowledgeAction = (
// 	dispatch: KnowledgeDispatch,
// ) => Promise<void>;
// export type KnowledgeDispatch = (
// 	action: KnowledgeAction | AsyncKnowledgeAction,
// ) => void;

// export function knowledgeReducer(
// 	state: KnowledgeState,
// 	action: KnowledgeAction,
// ): KnowledgeState {
// 	switch (action.type) {
// 		case "SET_KNOWLEDGES":
// 			return {
// 				...state,
// 				knowledges: action.knowledges,
// 			};
// 		case "ADD_KNOWLEDGE":
// 			return { ...state, knowledges: [...state.knowledges, action.knowledge] };
// 		case "UPDATE_KNOWLEDGE":
// 			return {
// 				...state,
// 				knowledges: state.knowledges.map((knowledge) => {
// 					if (knowledge.id !== action.knowledgeId) {
// 						return knowledge;
// 					}
// 					return {
// 						...knowledge,
// 						...action.updates,
// 					};
// 				}),
// 			};
// 		case "ADD_CONTENT":
// 			return {
// 				...state,
// 				knowledges: state.knowledges.map((knowledge) => {
// 					if (knowledge.id !== action.knowledgeId) {
// 						return knowledge;
// 					}
// 					return {
// 						...knowledge,
// 						contents: [...knowledge.contents, action.content],
// 					};
// 				}),
// 			};
// 		case "REMOVE_CONTENT":
// 			return {
// 				...state,
// 				knowledges: state.knowledges.map((knowledge) => {
// 					if (knowledge.id !== action.knowledgeId) {
// 						return knowledge;
// 					}
// 					return {
// 						...knowledge,
// 						contents: knowledge.contents.filter(
// 							(content) => content.id !== action.contentId,
// 						),
// 					};
// 				}),
// 			};
// 		case "SET_LOADING":
// 			return {
// 				...state,
// 				isLoading: true,
// 			};
// 		default:
// 			return state;
// 	}
// }
