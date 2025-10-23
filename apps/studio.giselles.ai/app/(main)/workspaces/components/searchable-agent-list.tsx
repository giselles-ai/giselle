"use client";

import { useMemo, useState } from "react";

import type { agents as dbAgents } from "@/drizzle";
import { Card } from "../../settings/components/card";
import { AgentCard } from "./agent-card";
import { AppListItem } from "./app-list-item";
import { DeleteAgentButton } from "./delete-agent-button";
import { DuplicateAgentButton } from "./duplicate-agent-button";
import { SearchHeader } from "./search-header";

type SortOption = "name-asc" | "name-desc" | "date-desc" | "date-asc";
type ViewMode = "grid" | "list";

export function SearchableAgentList({
	agents,
}: {
	agents: (typeof dbAgents.$inferSelect)[];
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
				<Card className="gap-0 py-2">
					{sortedAgents.map((agent) => {
						if (!agent.workspaceId) return null;
						return (
							<AppListItem
								key={agent.id}
								href={`/workspaces/${agent.workspaceId}`}
								title={agent.name || "Untitled"}
								subtitle={`Edited ${agent.updatedAt.toLocaleDateString()}`}
								rightActions={
									<>
										<DuplicateAgentButton
											agentId={agent.id}
											agentName={agent.name || "Untitled"}
										/>
										<DeleteAgentButton
											agentId={agent.id}
											agentName={agent.name || "Untitled"}
										/>
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
