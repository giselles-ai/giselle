import {
	type FC,
	type PropsWithChildren,
	createContext,
	useContext,
} from "react";
import type { Node } from "../types";

type UpdateNodeFn = (
	portId: Node["id"],
	updates: Partial<Pick<Node, "data" | "name">>,
) => void;
type UpdateNodeContextState = {
	updateNode: UpdateNodeFn;
};

const UpdateNodeContext = createContext<UpdateNodeContextState | null>(null);

export type UpdateNodeProviderProps = {
	updateNode: UpdateNodeFn;
};
export const UpdateNodeProvider: FC<
	PropsWithChildren<UpdateNodeProviderProps>
> = ({ children, updateNode }) => {
	return (
		<UpdateNodeContext.Provider value={{ updateNode }}>
			{children}
		</UpdateNodeContext.Provider>
	);
};

export const useUpdateNode = () => {
	const context = useContext(UpdateNodeContext);
	if (!context) {
		throw new Error("useUpdateNode must be used within a UpdateNodeProvider");
	}
	return context;
};
