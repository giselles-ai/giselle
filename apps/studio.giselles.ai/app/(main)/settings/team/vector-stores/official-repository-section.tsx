import { SectionHeader } from "@giselle-internal/ui/section-header";
import { Card } from "@/components/ui/card";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import { OfficialRepositoryItem } from "./official-repository-item";

type OfficialRepositorySectionProps = {
	repositories: RepositoryWithStatuses[];
};

export function OfficialRepositorySection({
	repositories,
}: OfficialRepositorySectionProps) {
	if (repositories.length === 0) {
		return null;
	}

	return (
		<Card className="rounded-[8px] bg-transparent p-6 border-0">
			<SectionHeader
				title="Official GitHub Repositories"
				description="These are provided by Giselle and available to all users. Read-only."
				className="mb-4"
			/>
			<div className="space-y-4">
				{repositories.map((repo) => (
					<OfficialRepositoryItem
						key={repo.repositoryIndex.id}
						repositoryData={repo}
					/>
				))}
			</div>
		</Card>
	);
}
