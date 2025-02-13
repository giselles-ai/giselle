import {
	type FC,
	type PropsWithChildren,
	createContext,
	useContext,
} from "react";
import type { Port } from "../types";

type AddPortFn = (port: Port) => void;
type AddPortContextState = {
	addPort: AddPortFn;
};

const AddPortContext = createContext<AddPortContextState | null>(null);

export type AddPortProviderProps = {
	addPort: AddPortFn;
};
export const AddPortProvider: FC<PropsWithChildren<AddPortProviderProps>> = ({
	children,
	addPort,
}) => {
	return (
		<AddPortContext.Provider value={{ addPort }}>
			{children}
		</AddPortContext.Provider>
	);
};

export const useAddPort = () => {
	const context = useContext(AddPortContext);
	if (!context) {
		throw new Error("useAddPort must be used within a AddPortProvider");
	}
	return context;
};
