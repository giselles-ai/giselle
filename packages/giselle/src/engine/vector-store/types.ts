export const githubProvider = "github" as const;
export const githubPullRequestProvider = "githubPullRequest" as const;
export type VectorStoreSourceProvider =
	| typeof githubProvider
	| typeof githubPullRequestProvider;
export const vectorStoreSourceProviders = [
	githubProvider,
	githubPullRequestProvider,
] as const;

type VectorStoreReference<
	P extends VectorStoreSourceProvider,
	I extends object,
> = I & {
	provider: P;
};

/*
  If we need another provider, we can add it here.

  1. Add type to Provider

  ```ts
  type Provider = "github" | "Notion";
  ```

  2. Add type to VectorStoreReference

  ```ts
  export type NotionVectorStoreReference = VectorStoreReference<
    "Notion",
    {
      databaseId: string;
    }
  >;
  ```
 */

export type VectorStoreInfo<
	T extends VectorStoreReference<VectorStoreSourceProvider, object>,
> = {
	id: string;
	name: string;
	reference: T;
};

export type VectorStoreIdentifier<
	T extends VectorStoreReference<VectorStoreSourceProvider, object>,
> = Omit<T, "provider">;

// MARK: GitHubVectorStore

type GitHubVectorStoreReference = VectorStoreReference<
	"github",
	{
		owner: string;
		repo: string;
	}
>;
export type GitHubVectorStoreInfo = VectorStoreInfo<GitHubVectorStoreReference>;
export type GitHubVectorStoreIdentifier =
	VectorStoreIdentifier<GitHubVectorStoreReference>;

// MARK: GitHubPullRequestVectorStore

type GitHubPullRequestVectorStoreReference = VectorStoreReference<
	"githubPullRequest",
	{
		owner: string;
		repo: string;
	}
>;
export type GitHubPullRequestVectorStoreInfo =
	VectorStoreInfo<GitHubPullRequestVectorStoreReference>;
export type GitHubPullRequestVectorStoreIdentifier =
	VectorStoreIdentifier<GitHubPullRequestVectorStoreReference>;
