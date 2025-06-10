import type {
	Document,
	DocumentLoader,
	DocumentLoaderParams,
} from "@giselle/rag3";
import type { Octokit } from "@octokit/core";
import { fetchDefaultBranchHead } from "./blob-loader";

/**
 * GitHub repository loading parameters
 */
export interface GitHubDocumentLoaderParams extends DocumentLoaderParams {
	owner: string;
	repo: string;
	commitSha?: string;
}

/**
 * GitHub document metadata
 */
export type GitHubDocumentMetadata = {
	owner: string;
	repo: string;
	commitSha: string;
	fileSha: string;
	path: string;
	nodeId: string;
} & Record<string, unknown>;

/**
 * GitHub document loader that implements rag3's DocumentLoader interface
 */
export class GitHubDocumentLoader
	implements DocumentLoader<GitHubDocumentMetadata>
{
	private readonly maxBlobSize: number;
	private readonly maxRetries: number;

	constructor(
		private octokit: Octokit,
		options?: {
			maxBlobSize?: number;
			maxRetries?: number;
		},
	) {
		this.maxBlobSize = options?.maxBlobSize ?? 1024 * 1024; // 1MB default
		this.maxRetries = options?.maxRetries ?? 3;
	}

	async *load(
		params: DocumentLoaderParams,
	): AsyncIterable<Document<GitHubDocumentMetadata>> {
		// Type assertion to GitHubDocumentLoaderParams
		const githubParams = params as GitHubDocumentLoaderParams;
		const { owner, repo } = githubParams;
		let commitSha = githubParams.commitSha;

		// If no commit SHA provided, get the default branch HEAD
		if (!commitSha) {
			const defaultBranchHead = await fetchDefaultBranchHead(
				this.octokit,
				owner,
				repo,
			);
			commitSha = defaultBranchHead.sha;
		}

		console.log(`Loading repository ${owner}/${repo} at commit ${commitSha}`);

		// Get tree for the commit
		const { data: tree } = await this.octokit.request(
			"GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
			{
				owner,
				repo,
				tree_sha: commitSha,
				recursive: "true",
			},
		);

		// Check for tree truncation
		if (tree.truncated) {
			throw new Error(
				`Tree is truncated: ${owner}/${repo}/${tree.sha}. Consider using git clone or tarball API for large repositories.`,
			);
		}

		// Process each file in the tree
		for (const item of tree.tree) {
			if (item.type === "blob" && item.path && item.sha && item.size) {
				// Skip large files
				if (item.size > this.maxBlobSize) {
					console.warn(
						`Blob size is too large: ${item.size} bytes, skipping: ${item.path}`,
					);
					continue;
				}

				// Load the blob content
				const blobContent = await this.loadBlob(
					owner,
					repo,
					item.path,
					item.sha,
					commitSha,
				);

				// Skip binary files
				if (blobContent === null) {
					continue;
				}

				// Yield as document
				yield {
					content: blobContent.content,
					metadata: blobContent.metadata,
				};
			}
		}
	}

	private async loadBlob(
		owner: string,
		repo: string,
		path: string,
		fileSha: string,
		commitSha: string,
		currentAttempt = 1,
	): Promise<{ content: string; metadata: GitHubDocumentMetadata } | null> {
		try {
			// Fetch blob data
			const { data: blobData, status } = await this.octokit.request(
				"GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
				{
					owner,
					repo,
					file_sha: fileSha,
				},
			);

			// Only support base64 encoded content
			if (blobData.encoding !== "base64") {
				return null;
			}

			// Decode base64 content
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
			} catch {
				// Binary content will throw an error when trying to decode
				return null;
			}
		} catch (error: unknown) {
			if (
				error instanceof Error &&
				"status" in error &&
				typeof error.status === "number"
			) {
				// Handle errors with status
				const status = error.status || 0;

				// Retry on server errors
				if (status >= 500 && currentAttempt < this.maxRetries) {
					// Exponential backoff
					await new Promise((resolve) =>
						setTimeout(resolve, 2 ** currentAttempt * 100),
					);
					return this.loadBlob(
						owner,
						repo,
						path,
						fileSha,
						commitSha,
						currentAttempt + 1,
					);
				}
			}

			// Re-throw other errors
			throw new Error(
				`Failed to load blob ${owner}/${repo}/${path}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
}
