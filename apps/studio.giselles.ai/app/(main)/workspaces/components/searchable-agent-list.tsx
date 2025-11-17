"use client";

import { File } from "lucide-react";
import { useMemo, useState } from "react";
import type { agents as dbAgents } from "@/db";
import {
	AnthropicIcon,
	GitHubIcon,
	GoogleWhiteIcon,
	OpenaiIcon,
	PerplexityIcon,
} from "../../../../../../internal-packages/workflow-designer-ui/src/icons";
import { Card } from "../../settings/components/card";
import { AgentCard } from "./agent-card";
import { AppListItem } from "./app-list-item";
import { SearchHeader } from "./search-header";

function LLMProviderIcon({
	provider,
	className,
}: {
	provider: string;
	className?: string;
}) {
	switch (provider) {
		case "openai":
			return <OpenaiIcon className={className} />;
		case "anthropic":
			return <AnthropicIcon className={className} />;
		case "google":
			return <GoogleWhiteIcon className={className} />;
		case "perplexity":
			return <PerplexityIcon className={className} />;
		default:
			return null;
	}
}

type SortOption = "name-asc" | "name-desc" | "date-desc" | "date-asc";
type ViewMode = "grid" | "list";

type AgentWithMetadata = typeof dbAgents.$inferSelect & {
	executionCount: number;
	creator: {
		displayName: string | null;
		avatarUrl: string | null;
	} | null;
	githubRepositories: string[];
	documentVectorStoreFiles: string[];
	llmProviders: string[];
};

export function SearchableAgentList({
	agents,
}: {
	agents: AgentWithMetadata[];
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState<SortOption>("date-desc");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");

	// Filter agents based on search query
	const filteredAgents = useMemo(() => {
		if (!searchQuery) return agents;
		const query = searchQuery.toLowerCase();
		return agents.filter((agent) => {
			const agentName = agent.name?.toLowerCase() || "";
			return agentName.includes(query);
		});
	}, [agents, searchQuery]);

	// Sort agents based on selected option
	const sortedAgents = useMemo(() => {
		return [...filteredAgents].sort((a, b) => {
			switch (sortOption) {
				case "name-asc":
					return (a.name || "").localeCompare(b.name || "");
				case "name-desc":
					return (b.name || "").localeCompare(a.name || "");
				case "date-desc":
					return b.updatedAt.getTime() - a.updatedAt.getTime();
				case "date-asc":
					return a.updatedAt.getTime() - b.updatedAt.getTime();
				default:
					return 0;
			}
		});
	}, [filteredAgents, sortOption]);

	return (
		<>
			<SearchHeader
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				searchPlaceholder="Search Workspaces..."
				sortOption={sortOption}
				onSortChange={(value) => setSortOption(value as SortOption)}
				showViewToggle
				viewMode={viewMode}
				onViewModeChange={setViewMode}
			/>

			{sortedAgents.length === 0 && searchQuery ? (
				<div className="flex justify-center items-center h-full mt-12">
					<div className="grid gap-[8px] justify-center text-center">
						<h3 className="text-[18px] font-geist font-bold text-text/60">
							No workspaces found.
						</h3>
						<p className="text-[12px] font-geist text-text/60">
							Try searching with a different keyword.
						</p>
					</div>
				</div>
			) : viewMode === "grid" ? (
				<div className="relative flex h-full w-full flex-wrap items-start justify-start gap-4">
					{sortedAgents.map((agent) => (
						<AgentCard key={agent.id} agent={agent} />
					))}
				</div>
			) : (
				<Card className="!flex !flex-col gap-0 py-2">
					{/* Table Header */}
					<div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_auto] items-center gap-4 px-2 py-2 border-b-[0.5px] border-border-muted">
						<p className="text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
							Name
						</p>
						<p className="text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
							Integration
						</p>
						<p className="text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
							Connected
						</p>
						<p className="text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
							Builder
						</p>
						<p className="text-[12px] font-geist font-semibold text-text/60 uppercase tracking-wide">
							Runs
						</p>
					</div>
					{sortedAgents.map((agent) => {
						if (!agent.workspaceId) return null;
						return (
							<AppListItem
								key={agent.id}
								href={`/workspaces/${agent.workspaceId}`}
								title={agent.name || "Untitled"}
								subtitle={`Edited ${agent.updatedAt.toLocaleDateString()}`}
								creator={agent.creator?.displayName || null}
								githubRepositories={agent.githubRepositories}
								documentVectorStoreFiles={agent.documentVectorStoreFiles}
								executionCount={agent.executionCount}
								agentId={agent.id}
								agentName={agent.name || "Untitled"}
								integrationIcons={
									<>
										{agent.llmProviders?.map((provider) => (
											<LLMProviderIcon
												key={provider}
												provider={provider}
												className="w-4 h-4"
											/>
										))}
										{agent.githubRepositories &&
											agent.githubRepositories.length > 0 && (
												<GitHubIcon className="w-4 h-4 text-text/60" />
											)}
										{agent.documentVectorStoreFiles &&
											agent.documentVectorStoreFiles.length > 0 && (
												<File className="w-4 h-4 text-text/60" />
											)}
									</>
								}
							/>
						);
					})}
				</Card>
			)}
		</>
	);
}
