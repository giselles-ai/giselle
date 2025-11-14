import { EMBEDDING_PROFILES } from "@giselles-ai/protocol";

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

const orderedProfileIds = Object.keys(GITHUB_EMBEDDING_PROFILES)
	.map((id) => Number.parseInt(id, 10))
	.filter((id) => Number.isFinite(id))
	.sort((a, b) => a - b);

const fallbackProfileId = Number.parseInt(
	Object.keys(EMBEDDING_PROFILES)[0] ?? "1",
	10,
);

export const DEFAULT_GITHUB_EMBEDDING_PROFILE_ID = Number.isFinite(
	orderedProfileIds[0],
)
	? (orderedProfileIds[0] as number)
	: Number.isFinite(fallbackProfileId)
		? fallbackProfileId
		: 1;
