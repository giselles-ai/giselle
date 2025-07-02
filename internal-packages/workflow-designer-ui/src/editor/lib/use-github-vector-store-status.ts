import type { Node } from "@giselle-sdk/data-type";
import { isVectorStoreNode } from "@giselle-sdk/data-type";
import { useVectorStore } from "@giselle-sdk/giselle-engine/react";
import { useMemo } from "react";

export function useGitHubVectorStoreStatus(node: Node) {
	const vectorStore = useVectorStore();
	const github = vectorStore?.github;

	return useMemo(() => {
		if (
			!isVectorStoreNode(node, "github") ||
			node.content.source.state.status !== "configured"
		) {
			return { isOrphaned: false, repositoryId: undefined };
		}

		const { owner, repo } = node.content.source.state;
		const vectorStoreInfos = github ?? [];
		const foundInfo = vectorStoreInfos.find(
			(info) => info.reference.owner === owner && info.reference.repo === repo,
		);

		return {
			isOrphaned: !foundInfo,
			repositoryId: foundInfo?.id,
		};
	}, [node, github]);
}
