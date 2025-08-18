export type Comment = {
	id: string;
	body: string;
	authorType: "User" | "Bot" | string;
};

export type FileMetadata = {
	isGenerated: boolean;
	isBinary: boolean | null;
	byteSize: number;
	extension: string | null;
	language: string | null;
	lineCount: number | null;
};

export type PullRequestDetails = {
	title: string;
	body: string | null;
	comments: Comment[];
	files: Map<string, FileMetadata>;
};

type CacheKey = `${string}/${string}/${number}`;

export const prDetailsCache = new Map<number, Promise<PullRequestDetails>>();
export const diffsCache = new Map<CacheKey, Promise<Map<string, string>>>();

export function createCacheKey(
	owner: string,
	repo: string,
	prNumber: number,
): CacheKey {
	return `${owner}/${repo}/${prNumber}`;
}
