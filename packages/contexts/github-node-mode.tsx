"use client";

import { type ReactNode, createContext, useContext } from "react";

const GitHubNodeModeContext = createContext<boolean | undefined>(undefined);

export function GitHubNodeModeProvider({
	children,
	gitHubNodeMode,
}: { children: ReactNode; gitHubNodeMode: boolean }) {
	return (
		<GitHubNodeModeContext.Provider value={gitHubNodeMode}>
			{children}
		</GitHubNodeModeContext.Provider>
	);
}

export const useGitHubNodeMode = () => {
	const context = useContext(GitHubNodeModeContext);
	if (context === undefined) {
		throw new Error(
			"useGitHubNodeMode must be used within a GitHubNodeModeProvider",
		);
	}
	return context;
};
