import type { IssueDetails } from "./types";

type IssueKey = `${string}/${string}/${number}`;

type CacheEntry = {
	updatedAt: string;
	promise: Promise<IssueDetails>;
};

export const issueDetailsCache = new Map<IssueKey, CacheEntry>();

function createIssueKey(
	owner: string,
	repo: string,
	issueNumber: number,
): IssueKey {
	return `${owner}/${repo}/${issueNumber}`;
}

export function setCache(
	owner: string,
	repo: string,
	issueNumber: number,
	issueUpdatedAt: string,
	promise: Promise<IssueDetails>,
): void {
	const key = createIssueKey(owner, repo, issueNumber);
	issueDetailsCache.set(key, { updatedAt: issueUpdatedAt, promise });
}

export function getCache(
	owner: string,
	repo: string,
	issueNumber: number,
	issueUpdatedAt: string,
): Promise<IssueDetails> | undefined {
	const key = createIssueKey(owner, repo, issueNumber);
	const entry = issueDetailsCache.get(key);

	// Cache hit only if updatedAt matches
	if (entry && entry.updatedAt === issueUpdatedAt) {
		return entry.promise;
	}

	return undefined;
}
