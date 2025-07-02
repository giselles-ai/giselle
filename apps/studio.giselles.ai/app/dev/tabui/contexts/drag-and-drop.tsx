import {
	createContext,
	type FC,
	type PropsWithChildren,
	useContext,
	useState,
} from "react";

type DnDContext = {
	dragPayload: string | null;
	setDragPayload: (payload: string | null) => void;
};
const DnDContext = createContext<DnDContext | null>(null);

export const DnDProvider: FC<PropsWithChildren> = ({ children }) => {
	const [dragPayload, setDragPayload] = useState<string | null>(null);

	return (
		<DnDContext.Provider
			value={{
				dragPayload,
				setDragPayload,
			}}
		>
			{children}
		</DnDContext.Provider>
	);
};

export const useDnD = () => {
	const context = useContext(DnDContext);
	if (!context) {
		throw new Error("useDnD must be used within a DnDProvider");
	}
	return context;
};
