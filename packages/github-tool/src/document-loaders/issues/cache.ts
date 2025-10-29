import type { IssueDetails } from "./types";

type CacheKey = `${string}/${string}/${number}`;

export const issueDetailsCache = new Map<CacheKey, Promise<IssueDetails>>();

export function createCacheKey(
	owner: string,
	repo: string,
	issueNumber: number,
): CacheKey {
	return `${owner}/${repo}/${issueNumber}`;
}
