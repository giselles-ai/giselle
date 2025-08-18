import type { Octokit } from "@octokit/core";
import type { Client } from "urql";
import { executeRestRequest } from "../utils";
import type { Comment, FileMetadata, PullRequestDetails } from "./cache";
import {
	GetPullRequestDetailsQuery,
	GetPullRequestsMetadataQuery,
} from "./queries";

export type FetchContext = {
	client: Client;
	owner: string;
	repo: string;
};

export type DiffFetchContext = {
	octokit: Octokit;
	owner: string;
	repo: string;
};

export async function fetchDiffs(
	ctx: DiffFetchContext,
	prNumber: number,
): Promise<Map<string, string>> {
	const fileDiffs = new Map<string, string>();
	let page = 1;

	while (true) {
		const response = await executeRestRequest(
			() =>
				ctx.octokit.request(
					"GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
					{
						owner: ctx.owner,
						repo: ctx.repo,
						pull_number: prNumber,
						per_page: 100,
						page,
					},
				),
			"Pull Request Files",
			`${ctx.owner}/${ctx.repo}/pulls/${prNumber}/files?page=${page}`,
		);

		const files = response.data;

		for (const file of files) {
			if (!file.patch) {
				continue;
			}
			fileDiffs.set(file.filename, file.patch);
		}

		const linkHeader = response.headers.link;
		if (!linkHeader || !linkHeader.includes('rel="next"')) {
			break;
		}
		page++;
	}

	return fileDiffs;
}

export async function fetchPullRequestsMetadata(
	ctx: FetchContext,
	options: {
		first: number;
		after?: string | null;
	},
): Promise<{
	pullRequests: Array<{
		number: number;
		mergedAt: string | null;
		commentIds: string[];
		filePaths: string[];
	}>;
	pageInfo: {
		hasNextPage: boolean;
		endCursor: string | null;
	};
}> {
	const result = await ctx.client.query(GetPullRequestsMetadataQuery, {
		owner: ctx.owner,
		repo: ctx.repo,
		first: options.first,
		after: options.after,
	});

	if (result.error) {
		throw new Error(`GraphQL error: ${result.error.message}`);
	}

	const pullRequests = result.data?.repository?.pullRequests;
	if (!pullRequests) {
		throw new Error("Failed to fetch pull requests");
	}

	const prs =
		pullRequests.nodes
			?.map((pr) => {
				if (!pr) return null;

				const commentIds =
					pr.comments.nodes
						?.filter((c) => c && c.author?.__typename !== "Bot")
						.map((c) => c?.id)
						.filter((id): id is string => !!id) || [];

				const filePaths =
					pr.files?.nodes
						?.map((f) => f?.path)
						.filter((path): path is string => !!path) || [];

				return {
					number: pr.number,
					mergedAt: pr.mergedAt,
					commentIds,
					filePaths,
				};
			})
			.filter((pr): pr is NonNullable<typeof pr> => pr !== null) || [];

	return {
		pullRequests: prs,
		pageInfo: {
			hasNextPage: pullRequests.pageInfo.hasNextPage,
			endCursor: pullRequests.pageInfo.endCursor,
		},
	};
}

export async function fetchPullRequestDetails(
	ctx: FetchContext,
	prNumber: number,
): Promise<PullRequestDetails> {
	const result = await ctx.client.query(GetPullRequestDetailsQuery, {
		owner: ctx.owner,
		repo: ctx.repo,
		number: prNumber,
	});

	if (result.error) {
		throw new Error(`GraphQL error: ${result.error.message}`);
	}

	const pr = result.data?.repository?.pullRequest;
	if (!pr) {
		throw new Error(`Pull request #${prNumber} not found`);
	}

	// Extract comments
	const comments: Comment[] = [];
	for (const comment of pr.comments.nodes || []) {
		if (comment) {
			comments.push({
				id: comment.id,
				body: comment.body,
				authorType: comment.author?.__typename || "Unknown",
			});
		}
	}

	// Extract file metadata
	const files = new Map<string, FileMetadata>();
	const headCommit = pr.headCommit.nodes?.[0]?.commit;
	if (headCommit?.tree) {
		for (const entry of headCommit.tree.entries || []) {
			if (entry.object?.__typename === "Blob" && entry.path) {
				files.set(entry.path, {
					isGenerated: entry.isGenerated,
					isBinary: entry.object.isBinary,
					byteSize: entry.object.byteSize,
					extension: entry.extension,
					language: null,
					lineCount: entry.lineCount,
				});
			}
		}
	}

	return {
		title: pr.title,
		body: pr.body,
		comments,
		files,
	};
}
