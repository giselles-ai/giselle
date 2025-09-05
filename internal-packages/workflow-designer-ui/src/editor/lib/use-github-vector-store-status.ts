import type { NodeLike } from "@giselle-sdk/data-type";
import { isVectorStoreNode } from "@giselle-sdk/data-type";
import { useVectorStore } from "@giselle-sdk/giselle/react";
import { useMemo } from "react";

export function useGitHubVectorStoreStatus(node: NodeLike) {
	const vectorStore = useVectorStore();
	const githubRepositoryIndexes = vectorStore?.githubRepositoryIndexes ?? [];

	return useMemo(() => {
		if (
			!isVectorStoreNode(node, "github") ||
			node.content.source.state.status !== "configured"
		) {
			return {
				isOrphaned: false,
				repositoryId: undefined,
				isEmbeddingProfileOrphaned: false,
			};
		}

		const { owner, repo } = node.content.source.state;
		const contentType = node.content.source.state.contentType;
		const embeddingProfileId = node.content.source.state.embeddingProfileId;

		const foundInfo = githubRepositoryIndexes.find(
			(info) =>
				info.owner === owner &&
				info.repo === repo &&
				info.contentTypes?.some(
					(ct: { contentType: string }) => ct.contentType === contentType,
				),
		);

		// Check if embedding profile is available
		let isEmbeddingProfileOrphaned = false;
		if (foundInfo && embeddingProfileId) {
			const contentTypeProfile = foundInfo.contentTypes?.find(
				(ct: { contentType: string }) => ct.contentType === contentType,
			);
			if (contentTypeProfile) {
				isEmbeddingProfileOrphaned =
					!contentTypeProfile.embeddingProfileIds.includes(embeddingProfileId);
			}
		}

		return {
			isOrphaned: !foundInfo,
			repositoryId: foundInfo?.id,
			isEmbeddingProfileOrphaned,
		};
	}, [node, githubRepositoryIndexes]);
}
