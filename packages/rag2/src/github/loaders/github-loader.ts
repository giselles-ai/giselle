import type { Octokit } from "@octokit/core";
import type { z } from "zod/v4";
import type { DocumentLoader, DocumentMetadata } from "../../types";
import { GitHubBlobSource, GitHubBlobSourceType } from "../types";

export interface GitHubLoaderOptions<TMetadata extends DocumentMetadata> {
	maxBlobSize?: number;
	maxRetries?: number;
	metadataSchema: z.ZodSchema<TMetadata>;
}

interface GitHubLoadBlobParams {
	owner: string;
	repo: string;
	path: string;
	fileSha: string;
}

interface GitHubBlobResult<TMetadata extends DocumentMetadata> {
	content: string;
	metadata: TMetadata;
}

export class GitHubBlobLoader<TMetadata extends DocumentMetadata>
	implements DocumentLoader<GitHubBlobSource>
{
	private readonly maxBlobSize: number;
	private readonly maxRetries: number;
	private readonly metadataSchema: z.ZodSchema<TMetadata>;

	constructor(
		private octokit: Octokit,
		options: GitHubLoaderOptions<TMetadata>,
	) {
		this.maxBlobSize = options.maxBlobSize ?? 1024 * 1024; // 1MB default
		this.maxRetries = options.maxRetries ?? 3;
		this.metadataSchema = options.metadataSchema;
	}

	async *loadStream(source: GitHubBlobSource): AsyncIterable<{
		content: string;
		metadata: TMetadata;
	}> {
		const { owner, repo, commitSha } = source;

		try {
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
				/**
				 * The limit for the tree array is 100,000 entries with a maximum size of 7 MB when using the recursive parameter.
				 * https://docs.github.com/en/rest/git/trees#get-a-tree
				 *
				 * If this limit is exceeded, please consider another way to ingest the repository.
				 * For example, you can use the git clone or GET tarball API for first time ingestion.
				 */
				throw new Error(`Tree is truncated: ${owner}/${repo}/${tree.sha}`);
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

					// Load the blob
					const blob = await this.loadBlob(
						{
							owner,
							repo,
							path: item.path,
							fileSha: item.sha,
						},
						commitSha,
					);

					// Skip binary files
					if (blob === null) {
						continue;
					}

					// Yield as document
					yield {
						content: blob.content,
						metadata: blob.metadata,
					};
				}
			}
		} catch (error) {
			throw new Error(
				`Failed to load GitHub repository ${owner}/${repo}: ${error}`,
			);
		}
	}

	validateSource(source: unknown): GitHubBlobSource {
		return GitHubBlobSource.parse(source);
	}

	/**
	 * Loads a GitHub blob (file) by SHA with retry logic and binary detection
	 */
	private async loadBlob(
		params: GitHubLoadBlobParams,
		commitSha: string,
		currentAttempt = 0,
	): Promise<GitHubBlobResult<TMetadata> | null> {
		const { owner, repo, path, fileSha } = params;

		try {
			// Fetch blob from GitHub API
			// Note: This endpoint supports blobs up to 100 megabytes in size.
			// https://docs.github.com/en/rest/git/blobs#get-a-blob
			const response = await this.octokit.request(
				"GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
				{
					owner,
					repo,
					file_sha: fileSha,
				},
			);

			const { data: blobData, status } = response;

			// Handle server errors with retry logic
			if (status >= 500) {
				if (currentAttempt >= this.maxRetries) {
					throw new Error(
						`Network error: ${status} when fetching ${owner}/${repo}/${fileSha}`,
					);
				}
				// Exponential backoff
				await new Promise((resolve) =>
					setTimeout(resolve, 2 ** currentAttempt * 100),
				);
				return this.loadBlob(params, commitSha, currentAttempt + 1);
			}

			// Only support base64 encoded content
			if (blobData.encoding !== "base64") {
				return null;
			}

			// Decode base64 content
			const contentInBytes = Buffer.from(blobData.content, "base64");

			// Check if the content is binary using TextDecoder with fatal option
			// This is more robust than extension-based detection
			const textDecoder = new TextDecoder("utf-8", { fatal: true });
			try {
				const decodedContent = textDecoder.decode(contentInBytes);

				// Skip empty files
				if (decodedContent.trim().length === 0) {
					return null;
				}

				// Create basic metadata object
				const basicMetadata = {
					type: GitHubBlobSourceType,
					owner,
					repo,
					commitSha,
					fileSha,
					path,
					nodeId: blobData.node_id,
				};

				// Transform using zodSchema (always present, no casting needed)
				const metadata = this.metadataSchema.parse(basicMetadata);

				return {
					content: decodedContent,
					metadata,
				};
			} catch (error) {
				// Binary content will throw an error when trying to decode
				return null;
			}
		} catch (error) {
			console.warn(`Failed to load blob ${path}:`, error);
			// Return null to skip this file and continue processing others
			return null;
		}
	}
}
