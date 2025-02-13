import {
	type FC,
	type PropsWithChildren,
	createContext,
	useContext,
} from "react";
import type { Port } from "../types";

type UpdatePortFn = (portId: Port["id"], updates: Partial<Port>) => void;
type UpdatePortContextState = {
	updatePort: UpdatePortFn;
};

const UpdatePortContext = createContext<UpdatePortContextState | null>(null);

export type UpdatePortProviderProps = {
	updatePort: UpdatePortFn;
};
export const UpdatePortProvider: FC<
	PropsWithChildren<UpdatePortProviderProps>
> = ({ children, updatePort }) => {
	return (
		<UpdatePortContext.Provider value={{ updatePort }}>
			{children}
		</UpdatePortContext.Provider>
	);
};

export const useUpdatePort = () => {
	const context = useContext(UpdatePortContext);
	if (!context) {
		throw new Error("useUpdatePort must be used within a UpdatePortProvider");
	}
	return context;
};
