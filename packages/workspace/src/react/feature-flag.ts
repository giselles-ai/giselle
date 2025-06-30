import { createContext, useContext } from "react";

export interface FeatureFlagContextValue {
	runV3: boolean;
	sidemenu: boolean;
	githubTools: boolean;
	webSearchAction: boolean;
	layoutV2: boolean;
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
