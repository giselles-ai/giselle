import {
	type FC,
	type PropsWithChildren,
	createContext,
	useContext,
} from "react";
import type { Knowledge } from "../../knowledges";
import type { Port } from "../types";

type KnowledgeContextState = {
	knowledges: Knowledge[];
};

const KnowledgeContext = createContext<KnowledgeContextState | null>(null);

export type KnowledgeProviderProps = {
	knowledges: Knowledge[];
};
export const KnowledgeProvider: FC<
	PropsWithChildren<KnowledgeProviderProps>
> = ({ children, knowledges }) => {
	return (
		<KnowledgeContext.Provider value={{ knowledges }}>
			{children}
		</KnowledgeContext.Provider>
	);
};

export const useKnowledge = () => {
	const context = useContext(KnowledgeContext);
	if (!context) {
		throw new Error("useKnowledge must be used within a KnowledgeProvider");
	}
	return context;
};
