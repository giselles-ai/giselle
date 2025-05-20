import type {
	GitHubVectorStoreReference,
	VectorStoreAdaptor,
	VectorStoreIdentifier,
	VectorStoreInfo,
} from "../types";

export class GitHubVectorStoreAdaptor
	implements VectorStoreAdaptor<GitHubVectorStoreReference>
{
	private vectorStores = [
		{
			id: "gthbi_1",
			dbId: 1,
			owner: "example",
			repo: "sample-repository",
			installationId: 1,
		},
		{
			id: "gthbi_2",
			dbId: 2,
			owner: "example",
			repo: "sample-repository2",
			installationId: 2,
		},
		{
			id: "gthbi_3",
			dbId: 3,
			owner: "example",
			repo: "sample-repository3",
			installationId: 3,
		},
	];

	getVectorStoreList = (): VectorStoreInfo<GitHubVectorStoreReference>[] => {
		return this.vectorStores.map((vectorStore) => ({
			id: vectorStore.id,
			name: `${vectorStore.owner}/${vectorStore.repo}`,
			reference: {
				provider: "github",
				owner: vectorStore.owner,
				repo: vectorStore.repo,
			},
		}));
	};

	getVectorStoreReference = (
		identifier: VectorStoreIdentifier<GitHubVectorStoreReference>,
	): GitHubVectorStoreReference => {
		const vectorStore = this.vectorStores.find(
			(vectorStore) =>
				vectorStore.owner === identifier.owner &&
				vectorStore.repo === identifier.repo,
		);
		if (!vectorStore) {
			throw new Error(
				`Vector store with owner ${identifier.owner} and repo ${identifier.repo} not found`,
			);
		}
		return {
			provider: "github",
			owner: vectorStore.owner,
			repo: vectorStore.repo,
		};
	};
}
