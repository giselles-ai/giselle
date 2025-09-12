import { EMBEDDING_PROFILES } from "@giselle-sdk/data-type";

// GitHub Vector Store UI embedding profiles
// - Cohere is intentionally excluded (hidden in the UI)
// - NOTE: This is defined locally for the GitHub settings UI only (temporary).
//   If we later support Cohere in GitHub Vector Stores, we should remove this
//   file and use EMBEDDING_PROFILES directly, or move this filter to a shared layer.
export const GITHUB_EMBEDDING_PROFILES = Object.fromEntries(
	Object.entries(EMBEDDING_PROFILES).filter(
		([, profile]) => profile.provider !== "cohere",
	),
) as typeof EMBEDDING_PROFILES;
