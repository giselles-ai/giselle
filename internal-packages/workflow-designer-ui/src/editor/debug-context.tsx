import { createContext, useContext, useState, type ReactNode } from "react";

// Debug state type
export type GitHubAuthDebugState =
	| "default"
	| "unauthorized"
	| "not-installed"
	| "installed";

// Debug context type
interface DebugContextType {
	githubAuthState: GitHubAuthDebugState;
	setGithubAuthState: (state: GitHubAuthDebugState) => void;
}

// Create context with default values
const DebugContext = createContext<DebugContextType>({
	githubAuthState: "default",
	setGithubAuthState: () => {},
});

// Props type for context provider
interface DebugProviderProps {
	children: ReactNode;
}

// Debug context provider component
export function DebugProvider({ children }: DebugProviderProps) {
	const [githubAuthState, setGithubAuthState] =
		useState<GitHubAuthDebugState>("default");

	const value = {
		githubAuthState,
		setGithubAuthState,
	};

	return (
		<DebugContext.Provider value={value}>{children}</DebugContext.Provider>
	);
}

// Hook to use debug context
export function useDebug() {
	return useContext(DebugContext);
} 