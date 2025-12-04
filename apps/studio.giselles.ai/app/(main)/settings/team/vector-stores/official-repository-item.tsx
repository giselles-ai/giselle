"use client";

import { useMemo } from "react";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import { GITHUB_EMBEDDING_PROFILES } from "./github-embedding-profiles";
import { OfficialEmbeddingModelCard } from "./official-embedding-model-card";
import { AccentLink } from "./ui/accent-link";
import { GlassCard } from "./ui/glass-card";

type OfficialRepositoryItemProps = {
	repositoryData: RepositoryWithStatuses;
};

export function OfficialRepositoryItem({
	repositoryData,
}: OfficialRepositoryItemProps) {
	const { repositoryIndex, contentStatuses } = repositoryData;

	// Derive unique embedding profile IDs from content statuses
	const embeddingProfileIds = useMemo(
		() =>
			[...new Set(contentStatuses.map((cs) => cs.embeddingProfileId))].sort(
				(a, b) => a - b,
			),
		[contentStatuses],
	);

	return (
		<GlassCard className="group" paddingClassName="px-[24px] py-[16px]">
			{/* Repository Header */}
			<div className="flex items-center justify-between gap-4 mb-3">
				<div className="flex items-center gap-2">
					<AccentLink
						href={`https://github.com/${repositoryIndex.owner}/${repositoryIndex.repo}`}
						target="_blank"
						rel="noopener noreferrer"
						className="font-medium text-[16px] leading-[22.4px] font-geist"
					>
						{repositoryIndex.owner}/{repositoryIndex.repo}
					</AccentLink>
				</div>
			</div>

			{/* Cards grid */}
			<div className="grid grid-cols-3 gap-3 w-full">
				{embeddingProfileIds.map((profileId) => {
					const profile = GITHUB_EMBEDDING_PROFILES[profileId];
					return (
						<OfficialEmbeddingModelCard
							key={profileId}
							profile={profile}
							profileId={profileId}
							contentStatuses={contentStatuses}
						/>
					);
				})}
			</div>
		</GlassCard>
	);
}
