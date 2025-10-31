import type { IssueDetails } from "./types";

type CacheKey = `${string}/${string}/${number}/${string}`;

export const issueDetailsCache = new Map<CacheKey, Promise<IssueDetails>>();

export function createCacheKey(
	owner: string,
	repo: string,
	issueNumber: number,
	issueUpdatedAt: string,
): CacheKey {
	return `${owner}/${repo}/${issueNumber}/${issueUpdatedAt}`;
}
