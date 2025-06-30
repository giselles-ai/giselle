import type { Document, DocumentLoader } from "@giselle-sdk/rag";
import type { Octokit } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

type GitHubBlobMetadata = {
	owner: string;
	repo: string;
	fileSha: string;
	path: string;
};

type GitHubBlobLoaderParams = {
	owner: string;
	repo: string;
	commitSha: string;
};

type GitHubBlobLoaderOptions = {
	maxBlobSize?: number;
};

export function createGitHubBlobLoader(
	octokit: Octokit,
	params: GitHubBlobLoaderParams,
	options: GitHubBlobLoaderOptions = {},
): DocumentLoader<GitHubBlobMetadata> {
	const { maxBlobSize = 1024 * 1024 } = options;

	const { owner, repo, commitSha } = params;

	const loadMetadata = async function* (): AsyncIterable<GitHubBlobMetadata> {
		for await (const entry of traverseTree(octokit, owner, repo, commitSha)) {
			const { path, type, sha: fileSha, size } = entry;

			// Process only blob entries (files)
			if (type !== "blob" || !fileSha || !size || !path) {
				continue;
			}

			if (size > maxBlobSize) {
				console.warn(
					`Blob size is too large: ${size} bytes, skipping: ${path}`,
				);
				continue;
			}

			yield {
				owner,
				repo,
				fileSha,
				path,
			};
		}
	};

	const loadDocument = async (
		metadata: GitHubBlobMetadata,
	): Promise<Document<GitHubBlobMetadata> | null> => {
		const { path, fileSha } = metadata;

		const blob = await loadBlob(octokit, { owner, repo, path, fileSha });

		if (blob === null) {
			return null;
		}

		return {
			content: blob.content,
			metadata: blob.metadata,
		};
	};

	return { loadMetadata, loadDocument };
}

/**
 * Execute an Octokit request with retry logic for 5xx errors
 */
async function executeWithRetry<T>(
	operation: () => Promise<T>,
	resourceType: string,
	resourcePath: string,
	currentAttempt = 0,
	maxAttempt = 3,
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof RequestError) {
			// Handle 5xx errors with retry
			if (error.status && error.status >= 500) {
				if (currentAttempt >= maxAttempt) {
					throw new Error(
						`GitHub Server error: ${error.status} when fetching ${resourceType} ${resourcePath}`,
					);
				}
				await new Promise((resolve) =>
					setTimeout(resolve, 2 ** currentAttempt * 1000),
				);
				return executeWithRetry(
					operation,
					resourceType,
					resourcePath,
					currentAttempt + 1,
					maxAttempt,
				);
			}

			// Handle 404 errors with helpful message
			if (error.status === 404) {
				throw new Error(
					`${resourceType} not found: ${resourcePath}. This may be due to insufficient permissions or the resource being private/deleted.`,
				);
			}

			// Other 4xx errors (including rate limit: 403, 429)
			if (error.status && error.status >= 400 && error.status < 500) {
				throw new Error(
					`GitHub API error ${error.status}: ${error.message} when fetching ${resourceType} ${resourcePath}`,
				);
			}
		}
		// Re-throw any other errors
		throw error;
	}
}

type GitHubLoadBlobParams = {
	owner: string;
	repo: string;
	path: string;
	fileSha: string;
};

async function loadBlob(
	octokit: Octokit,
	params: GitHubLoadBlobParams,
): Promise<{ content: string; metadata: GitHubBlobMetadata } | null> {
	const { owner, repo, path, fileSha } = params;

	// Fetch blob from GitHub API
	// Note: This endpoint supports blobs up to 100 megabytes in size.
	// https://docs.github.com/en/rest/git/blobs#get-a-blob
	const { data: blobData } = await executeWithRetry(
		() =>
			octokit.request("GET /repos/{owner}/{repo}/git/blobs/{file_sha}", {
				owner,
				repo,
				file_sha: fileSha,
			}),
		"Blob",
		`${owner}/${repo}/${fileSha} at path ${path}`,
	);

	// Only support base64 encoded content
	if (blobData.encoding !== "base64") {
		return null;
	}

	const contentInBytes = Buffer.from(blobData.content, "base64");

	// Check if the content is binary
	// We use the TextDecoder with fatal option to detect non-text content
	const textDecoder = new TextDecoder("utf-8", { fatal: true });
	try {
		const decodedContent = textDecoder.decode(contentInBytes);
		return {
			content: decodedContent,
			metadata: {
				owner,
				repo,
				fileSha,
				path,
			},
		};
	} catch (error: unknown) {
		// Binary content will throw an error when trying to decode
		return null;
	}
}

/**
 * Iterator for traversing a GitHub repository tree
 */
async function* traverseTree(
	octokit: Octokit,
	owner: string,
	repo: string,
	treeSha: string,
): AsyncGenerator<
	{
		path?: string;
		mode?: string;
		type?: string;
		sha?: string;
		size?: number;
		url?: string;
	},
	void,
	unknown
> {
	const { data: treeData } = await executeWithRetry(
		() =>
			octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
				owner,
				repo,
				tree_sha: treeSha,
				recursive: "true",
			}),
		"Tree",
		`${owner}/${repo}/${treeSha}`,
	);

	if (treeData.truncated) {
		/**
		 * The limit for the tree array is 100,000 entries with a maximum size of 7 MB when using the recursive parameter.
		 * https://docs.github.com/en/rest/git/trees#get-a-tree
		 *
		 * If this limit is exceeded, please consider another way to ingest the repository.
		 * For example, you can use the git clone or GET tarball API for first time ingestion.
		 */
		throw new Error(`Tree is truncated: ${owner}/${repo}/${treeData.sha}`);
	}

	for (const entry of treeData.tree) {
		yield entry;
	}
}

/**
 * Get the default branch HEAD commit for a GitHub repository
 */
export async function fetchDefaultBranchHead(
	octokit: Octokit,
	owner: string,
	repo: string,
) {
	const { data: repoData } = await executeWithRetry(
		() =>
			octokit.request("GET /repos/{owner}/{repo}", {
				owner,
				repo,
			}),
		"Repository",
		`${owner}/${repo}`,
	);
	const defaultBranch = repoData.default_branch;
	const { data: branchData } = await executeWithRetry(
		() =>
			octokit.request("GET /repos/{owner}/{repo}/branches/{branch}", {
				owner,
				repo,
				branch: defaultBranch,
			}),
		"Branch",
		`${owner}/${repo}/${defaultBranch}`,
	);
	return branchData.commit;
}
