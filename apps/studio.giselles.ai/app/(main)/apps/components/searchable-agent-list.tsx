"use client";

import {
	ArrowDownAZ,
	ArrowUpAZ,
	ChevronDown,
	Clock,
	LayoutGrid,
	LayoutList,
	Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card } from "../../settings/components/card";
import { AgentGrid } from "./agent-grid";
import { DeleteAgentButton } from "./delete-agent-button";
import { DuplicateAgentButton } from "./duplicate-agent-button";
import type { AgentGridProps } from "./types";

type SortOption = "name-asc" | "name-desc" | "date-desc" | "date-asc";
type ViewMode = "grid" | "list";

function ListItem({ agent }: { agent: AgentGridProps["agents"][0] }) {
	return (
		<Link
			href={`/workspaces/${agent.workspaceId}`}
			className="group flex items-center justify-between px-2 py-3 first:border-t-0 border-t-[0.5px] border-white/10"
		>
			<div className="flex items-center gap-3">
				{/* Icon */}
				<div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-primary-100/20">
					<svg
						role="img"
						aria-label="App icon"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 486 640"
						className="h-5 w-5 text-white/40 transition-colors group-hover:text-primary-100"
						fill="currentColor"
					>
						<title>App Icon</title>
						<path d="M278.186 397.523C241.056 392.676 201.368 394.115 171.855 391.185C142.556 387.776 131.742 363.167 136.856 355.603C158.378 364.712 177.928 368.547 201.794 368.387C241.642 368.227 275.576 356.242 303.544 332.486C331.511 308.729 345.362 280.285 344.936 247.207C342.912 222.545 327.782 184.194 293.742 157.188C290.971 154.791 283.673 150.583 283.673 150.583C258.635 135.615 230.188 128.318 198.438 128.69C170.843 130.129 149.747 135.509 126.574 143.711C73.0358 162.781 54.7103 208.589 55.243 249.018V249.924C63.1273 312.298 93.8652 328.757 125.935 351.342L88.1651 394.913L89.1772 400.613C89.1772 400.613 144.527 399.441 174.412 401.998C257.783 410.84 291.877 467.408 292.516 511.14C293.209 560.784 250.431 625.022 180.645 625.555C81.2397 626.354 78.5229 422.292 78.5229 422.292L0 504.215C2.6636 550.237 46.613 601.958 82.5182 617.938C130.356 636.847 187.251 632.107 211.969 629.603C237.486 627.046 363.368 607.072 379.136 498.143C379.136 467.302 358.041 407.964 278.186 397.523ZM266.093 226.433C279.678 277.302 283.14 315.334 263.749 345.27C250.538 359.598 229.868 364.872 209.199 363.114C206.535 362.901 179.207 358.267 162.746 322.685C179.26 301.272 218.522 250.563 255.599 204.222C260.66 209.814 266.093 226.487 266.093 226.487V226.433ZM136.643 152.607H136.536C149.534 135.935 185.44 129.916 203.392 135.349C221.771 144.404 235.515 161.023 250.645 192.769L196.201 261.909L156.62 312.245C150.333 300.633 144.58 286.997 140.158 271.337C120.927 203.103 123.484 170.877 136.589 152.607H136.643Z" />
						<path d="M370.506 0C370.506 55.3433 310.362 106.638 255.013 106.638C310.362 106.638 370.506 157.933 370.506 213.277C370.506 157.933 430.65 106.638 486 106.638C430.65 106.638 370.506 55.3433 370.506 0Z" />
					</svg>
				</div>

				{/* Content */}
				<div className="flex flex-col gap-y-1">
					<p className="text-[14px] font-sans text-white-900">
						{agent.name || "Untitled"}
					</p>
					<p className="text-[12px] font-geist text-white-400">
						Edited {agent.updatedAt.toLocaleDateString()}
					</p>
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
				<DuplicateAgentButton
					agentId={agent.id}
					agentName={agent.name || "Untitled"}
				/>
				<DeleteAgentButton
					agentId={agent.id}
					agentName={agent.name || "Untitled"}
				/>
			</div>
		</Link>
	);
}

export function SearchableAgentList({ agents }: AgentGridProps) {
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

	const getSortLabel = () => {
		switch (sortOption) {
			case "name-asc":
				return "Name (A-Z)";
			case "name-desc":
				return "Name (Z-A)";
			case "date-desc":
				return "Updated";
			case "date-asc":
				return "Oldest";
			default:
				return "Sort";
		}
	};

	return (
		<>
			<div className="mb-2 flex flex-col sm:flex-row gap-3 items-center">
				<div className="relative flex-1 w-full">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black-300 h-4 w-4" />
					<Input
						type="text"
						placeholder="Search Projects..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-12 pr-4 h-10 w-full bg-black-700/50 border-black-600 text-white placeholder:text-black-400"
					/>
				</div>
				<div className="flex gap-2">
					{/* Sort Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="link"
								className="w-auto justify-start gap-2 px-0 py-2 h-10 border-0 hover:bg-transparent hover:text-current group [&[data-sort-type='name-asc']_.sort-icon-name-asc]:block [&[data-sort-type='name-desc']_.sort-icon-name-desc]:block [&[data-sort-type='date-desc']_.sort-icon-date]:block [&[data-sort-type='date-asc']_.sort-icon-date]:block"
								data-sort-type={sortOption}
							>
								<ArrowDownAZ className="h-4 w-4 hidden sort-icon-name-asc" />
								<ArrowUpAZ className="h-4 w-4 hidden sort-icon-name-desc" />
								<Clock className="h-4 w-4 hidden sort-icon-date" />
								<span className="text-sm hidden sm:inline">
									{getSortLabel()}
								</span>
								<ChevronDown className="h-4 w-4 opacity-60" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="p-1 border-[0.25px] border-white/10 rounded-[8px] min-w-[180px] bg-black-900 shadow-none"
						>
							<DropdownMenuItem
								onClick={() => setSortOption("date-desc")}
								className="flex items-center w-full px-3 py-2 text-left text-[14px] leading-[16px] hover:bg-white/5 text-white-400 rounded-md cursor-pointer"
							>
								<Clock className="mr-3 h-4 w-4" />
								Updated
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setSortOption("date-asc")}
								className="flex items-center w-full px-3 py-2 text-left text-[14px] leading-[16px] hover:bg-white/5 text-white-400 rounded-md cursor-pointer"
							>
								<Clock className="mr-3 h-4 w-4" />
								Oldest
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setSortOption("name-asc")}
								className="flex items-center w-full px-3 py-2 text-left text-[14px] leading-[16px] hover:bg-white/5 text-white-400 rounded-md cursor-pointer"
							>
								<ArrowDownAZ className="mr-3 h-4 w-4" />
								Name (A-Z)
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setSortOption("name-desc")}
								className="flex items-center w-full px-3 py-2 text-left text-[14px] leading-[16px] hover:bg-white/5 text-white-400 rounded-md cursor-pointer"
							>
								<ArrowUpAZ className="mr-3 h-4 w-4" />
								Name (Z-A)
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* View Mode Toggle */}
					<div className="flex rounded-lg border border-black-600 overflow-hidden">
						<button
							type="button"
							onClick={() => setViewMode("grid")}
							className={`w-10 h-10 flex items-center justify-center transition-colors ${
								viewMode === "grid"
									? "bg-black-600 text-white"
									: "bg-black-700/50 text-black-300 hover:text-white"
							}`}
						>
							<LayoutGrid className="h-4 w-4" />
						</button>
						<div className="w-px bg-black-600" />
						<button
							type="button"
							onClick={() => setViewMode("list")}
							className={`w-10 h-10 flex items-center justify-center transition-colors ${
								viewMode === "list"
									? "bg-black-600 text-white"
									: "bg-black-700/50 text-black-300 hover:text-white"
							}`}
						>
							<LayoutList className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{sortedAgents.length === 0 && searchQuery ? (
				<div className="flex justify-center items-center h-full mt-12">
					<div className="grid gap-[8px] justify-center text-center">
						<h3 className="text-[18px] font-geist font-bold text-black-400">
							No apps found.
						</h3>
						<p className="text-[12px] font-geist text-black-400">
							Try searching with a different keyword.
						</p>
					</div>
				</div>
			) : viewMode === "grid" ? (
				<AgentGrid agents={sortedAgents} />
			) : (
				<Card className="gap-0 py-2">
					{sortedAgents.map((agent) => {
						if (!agent.workspaceId) return null;

						return <ListItem key={agent.id} agent={agent} />;
					})}
				</Card>
			)}
		</>
	);
}
