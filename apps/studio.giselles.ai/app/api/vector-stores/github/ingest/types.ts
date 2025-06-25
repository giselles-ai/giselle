export type TargetGitHubRepository = {
	dbId: number;
	owner: string;
	repo: string;
	teamDbId: number;
	installationId: number;
	lastIngestedCommitSha: string | null;
};
