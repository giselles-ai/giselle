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
				<div className="flex items-center mb-4">
					<div>
						<h4 className="text-white-400 font-medium text-[18px] leading-[21.6px] font-sans">
							GitHub Repositories
						</h4>
						<p className="text-black-400 text-[14px] leading-[20.4px] font-geist mt-1">
							You can ingest your project's code into a Vector Store and use it
							in GitHub Vector Store Nodes.
						</p>
					</div>
				</div>

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
		<div className="text-black-300 text-center py-16 bg-black-300/10 rounded-lg">
			<div>No repositories are registered.</div>
			<div>
				Please register a repository using the "Register Repository" button.
			</div>
		</div>
	);
}
