import { Card } from "@/components/ui/card";
import type { GitHubRepositoryIndexId } from "@/packages/types";
import { RepositoryItem } from "./repository-item";
import type { RepositoryIndexWithContentStatus } from "./types";

type RepositoryListProps = {
	repositoryIndexes: RepositoryIndexWithContentStatus[];
	deleteRepositoryIndexAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<void>;
	triggerManualIngestAction: (
		indexId: GitHubRepositoryIndexId,
	) => Promise<{ success: boolean; error?: string }>;
};

export function RepositoryList({
	repositoryIndexes,
	deleteRepositoryIndexAction,
	triggerManualIngestAction,
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

				{repositoryIndexes.length > 0 ? (
					<div className="space-y-4">
						{repositoryIndexes.map((index) => (
							<RepositoryItem
								key={index.id}
								repositoryIndex={index}
								deleteRepositoryIndexAction={deleteRepositoryIndexAction}
								triggerManualIngestAction={triggerManualIngestAction}
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
