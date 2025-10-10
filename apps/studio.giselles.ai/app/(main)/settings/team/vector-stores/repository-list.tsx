import { EmptyState } from "@giselle-internal/ui/empty-state";
import { SectionHeader } from "@giselle-internal/ui/section-header";
import { Card } from "@/components/ui/card";
import type { GitHubRepositoryContentType } from "@/drizzle";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import { RepositoryItem } from "./repository-item";

type RepositoryListProps = {
	repositories: RepositoryWithStatuses[];
	deleteRepositoryIndexAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<void>;
	triggerManualIngestAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<{ success: boolean; error?: string }>;
	updateRepositoryIndexAction: (
		repositoryIndexId: GitHubRepositoryIndexId,
		contentTypes: {
			contentType: GitHubRepositoryContentType;
			enabled: boolean;
		}[],
		embeddingProfileIds?: number[],
	) => Promise<{ success: boolean; error?: string }>;
};

export function RepositoryList({
	repositories,
	deleteRepositoryIndexAction,
	triggerManualIngestAction,
	updateRepositoryIndexAction,
}: RepositoryListProps) {
	return (
		<div className="flex flex-col gap-y-[16px]">
			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<SectionHeader
					title="GitHub Repositories"
					description="You can ingest your project's code into a Vector Store and use it in GitHub Vector Store Nodes."
					className="mb-4"
				/>

				{repositories.length > 0 ? (
					<div className="space-y-4">
						{repositories.map((repo) => (
							<RepositoryItem
								key={repo.repositoryIndex.id}
								repositoryData={repo}
								deleteRepositoryIndexAction={deleteRepositoryIndexAction}
								triggerManualIngestAction={triggerManualIngestAction}
								updateRepositoryIndexAction={updateRepositoryIndexAction}
							/>
						))}
					</div>
				) : (
					<EmptyRepositoryCard />
				)}
			</Card>
		</div>
	);
}

function EmptyRepositoryCard() {
	return (
		<div className="text-center py-16 bg-surface rounded-lg">
			<EmptyState
				title="No repositories are registered."
				description='Please register a repository using the "Register Repository" button.'
			/>
		</div>
	);
}
