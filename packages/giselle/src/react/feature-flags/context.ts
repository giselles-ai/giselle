import { createContext, useContext } from "react";

export interface FeatureFlagContextValue {
	webSearchAction: boolean;
	layoutV3: boolean;
	stage: boolean;
	aiGateway: boolean;
	googleUrlContext: boolean;
	documentVectorStore: boolean;
	githubIssuesVectorStore: boolean;
}
export const FeatureFlagContext = createContext<
	FeatureFlagContextValue | undefined
>(undefined);

export function useFeatureFlag(): FeatureFlagContextValue {
	const context = useContext(FeatureFlagContext);
	if (!context) {
		throw new Error(
			"useFeatureFlagContext must be used within a FeatureFlagProvider",
		);
	}
	return context;
}
