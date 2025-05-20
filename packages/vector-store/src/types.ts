type Provider = "github";

type VectorStoreReference<P extends Provider, I extends object> = I & {
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

export type VectorStoreInfo<T extends VectorStoreReference<Provider, object>> =
	{
		id: string;
		name: string;
		reference: T;
	};

export type VectorStoreIdentifier<
	T extends VectorStoreReference<Provider, object>,
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
