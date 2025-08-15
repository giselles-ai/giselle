import { createContext, useContext } from "react";

export interface FeatureFlagContextValue {
	runV3: boolean;
	webSearchAction: boolean;
	layoutV3: boolean;
	experimental_storage: boolean;
	stage: boolean;
	multiEmbedding: boolean;
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
