import {
	type Dispatch,
	type FC,
	type PropsWithChildren,
	createContext,
	useContext,
	useReducer,
} from "react";

type ContentState = {
	isAdding: boolean;
	isRemoving: boolean;
};

type ContentStateContext = {
	isAdding: boolean;
	isRemoving: boolean;
	dispatch: Dispatch<ContentStateAction>;
};

const ContentStateContext = createContext<ContentStateContext | null>(null);

type ContentStateAction =
	| { type: "ADDING" }
	| { type: "ADDED" }
	| { type: "REMOVING" }
	| { type: "REMOVED" };

const contentStateReducer = (
	state: ContentState,
	action: ContentStateAction,
): ContentState => {
	switch (action.type) {
		case "ADDING":
			return { ...state, isAdding: true };
		case "ADDED":
			return { ...state, isAdding: false };
		case "REMOVING":
			return { ...state, isRemoving: true };
		case "REMOVED":
			return { ...state, isRemoving: false };
		default:
			return state;
	}
};

export const ContentStateProvider: FC<PropsWithChildren> = ({ children }) => {
	const [state, dispatch] = useReducer(contentStateReducer, {
		isAdding: false,
		isRemoving: false,
	});

	return (
		<ContentStateContext.Provider
			value={{
				isAdding: state.isAdding,
				isRemoving: state.isRemoving,
				dispatch,
			}}
		>
			{children}
		</ContentStateContext.Provider>
	);
};

export const useContentState = (): ContentStateContext => {
	const context = useContext(ContentStateContext);
	if (!context) {
		throw new Error(
			"useContentState must be used within a ContentStateProvider",
		);
	}
	return context;
};
