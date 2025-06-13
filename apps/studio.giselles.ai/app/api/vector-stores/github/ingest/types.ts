export type TargetGitHubRepository = {
	owner: string;
	repo: string;
	teamDbId: number;
	installationId: number;
	lastIngestedCommitSha: string | null;
};
