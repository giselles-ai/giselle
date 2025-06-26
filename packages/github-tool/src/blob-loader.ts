import type { Document, DocumentLoader } from "@giselle-sdk/rag";
import type { Octokit } from "@octokit/core";

type GitHubBlobMetadata = {
	owner: string;
	repo: string;
	commitSha: string;
	fileSha: string;
	path: string;
	nodeId: string;
};

type GitHubBlobLoaderParams = {
	owner: string;
	repo: string;
	commitSha: string;
};

export function createGitHubBlobLoader(
	octokit: Octokit,
	options?: { maxBlobSize?: number },
): DocumentLoader<GitHubBlobMetadata, GitHubBlobLoaderParams> {
	const maxBlobSize = options?.maxBlobSize ?? 1024 * 1024; // 1MB default

	const load = async function* (
		params: GitHubBlobLoaderParams,
	): AsyncIterable<Document<GitHubBlobMetadata>> {
		const { owner, repo, commitSha } = params;

		console.log(`Loading repository ${owner}/${repo} at commit ${commitSha}`);

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

			const blob = await loadBlob(
				octokit,
				{ owner, repo, path, fileSha },
				commitSha,
			);

			if (blob === null) {
				continue;
			}

			yield {
				content: blob.content,
				metadata: blob.metadata,
			};
		}
	};

	return { load };
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
	commitSha: string,
	currentAttempt = 0,
	maxAttempt = 3,
) {
	const { owner, repo, path, fileSha } = params;

	// Fetch blob from GitHub API
	// Note: This endpoint supports blobs up to 100 megabytes in size.
	// https://docs.github.com/en/rest/git/blobs#get-a-blob
	const { data: blobData, status } = await octokit.request(
		"GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
		{
			owner,
			repo,
			file_sha: fileSha,
		},
	);

	if (status >= 500) {
		if (currentAttempt >= maxAttempt) {
			throw new Error(
				`Network error: ${status} when fetching ${owner}/${repo}/${fileSha}`,
			);
		}
		await new Promise((resolve) =>
			setTimeout(resolve, 2 ** currentAttempt * 100),
		);
		return loadBlob(octokit, params, commitSha, currentAttempt + 1, maxAttempt);
	}

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
				commitSha,
				fileSha,
				path,
				nodeId: blobData.node_id,
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
) {
	const { data: treeData } = await octokit.request(
		"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
		{
			owner,
			repo,
			tree_sha: treeSha,
			recursive: "true",
		},
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
	const { data: repoData } = await octokit.request(
		"GET /repos/{owner}/{repo}",
		{
			owner,
			repo,
		},
	);
	const defaultBranch = repoData.default_branch;
	const { data: branchData } = await octokit.request(
		"GET /repos/{owner}/{repo}/branches/{branch}",
		{
			owner,
			repo,
			branch: defaultBranch,
		},
	);
	return branchData.commit;
}
