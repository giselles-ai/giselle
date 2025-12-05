import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { githubRepositoryContentStatus } from "@/db";
import type { GITHUB_EMBEDDING_PROFILES } from "./github-embedding-profiles";

type OfficialEmbeddingModelCardProps = {
	profile: (typeof GITHUB_EMBEDDING_PROFILES)[keyof typeof GITHUB_EMBEDDING_PROFILES];
	profileId: number;
	contentStatuses: (typeof githubRepositoryContentStatus.$inferSelect)[];
};

export function OfficialEmbeddingModelCard({
	profile,
	profileId,
	contentStatuses,
}: OfficialEmbeddingModelCardProps) {
	// Filter statuses for this embedding profile
	const profileStatuses = contentStatuses.filter(
		(cs) => cs.embeddingProfileId === profileId,
	);

	// Get status for each content type
	const blobStatus = profileStatuses.find((cs) => cs.contentType === "blob");
	const issueStatus = profileStatuses.find((cs) => cs.contentType === "issue");
	const pullRequestStatus = profileStatuses.find(
		(cs) => cs.contentType === "pull_request",
	);

	return (
		<div
			className="rounded-lg p-3 min-h-0 w-full"
			style={{
				background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
				border: "0.5px solid rgba(255, 255, 255, 0.15)",
				boxShadow: "0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
			}}
		>
			{/* Model Header */}
			<div className="mb-3">
				<div className="text-xs text-inverse/80 font-medium mb-2">
					{profile.name}
				</div>
			</div>

			{/* Content Type Status - Simple Layout */}
			<div className="space-y-3 text-xs">
				{/* Code Section */}
				<div>
					<div className="flex items-center justify-between">
						<span className="text-gray-300">Code</span>
						<div className="flex items-center gap-2">
							{blobStatus?.enabled && blobStatus.status === "completed" ? (
								<StatusBadge status="success" variant="dot">
									Enabled
								</StatusBadge>
							) : (
								<StatusBadge status="ignored" variant="dot">
									Disabled
								</StatusBadge>
							)}
						</div>
					</div>
				</div>

				{/* Issues Section */}
				<div>
					<div className="flex items-center justify-between">
						<span className="text-gray-300">Issues</span>
						<div className="flex items-center gap-2">
							{issueStatus?.enabled && issueStatus.status === "completed" ? (
								<StatusBadge status="success" variant="dot">
									Enabled
								</StatusBadge>
							) : (
								<StatusBadge status="ignored" variant="dot">
									Disabled
								</StatusBadge>
							)}
						</div>
					</div>
				</div>

				{/* Pull Requests Section */}
				<div>
					<div className="flex items-center justify-between">
						<span className="text-gray-300">Pull Requests</span>
						<div className="flex items-center gap-2">
							{pullRequestStatus?.enabled &&
							pullRequestStatus.status === "completed" ? (
								<StatusBadge status="success" variant="dot">
									Enabled
								</StatusBadge>
							) : (
								<StatusBadge status="ignored" variant="dot">
									Disabled
								</StatusBadge>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
