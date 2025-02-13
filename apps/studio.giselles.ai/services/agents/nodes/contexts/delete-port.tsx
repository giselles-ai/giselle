import {
	type FC,
	type PropsWithChildren,
	createContext,
	useContext,
} from "react";
import type { Port } from "../types";

type DeletePortFn = (portId: Port["id"]) => void;
type DeletePortContextState = {
	deletePort: DeletePortFn;
};

const DeletePortContext = createContext<DeletePortContextState | null>(null);

export type DeletePortProviderProps = {
	deletePort: DeletePortFn;
};
export const DeletePortProvider: FC<
	PropsWithChildren<DeletePortProviderProps>
> = ({ children, deletePort }) => {
	return (
		<DeletePortContext.Provider value={{ deletePort }}>
			{children}
		</DeletePortContext.Provider>
	);
};

export const useDeletePort = () => {
	const context = useContext(DeletePortContext);
	if (!context) {
		throw new Error("useDeletePort must be used within a DeletePortProvider");
	}
	return context;
};
