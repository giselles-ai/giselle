"use client";

import { Button } from "@giselle-internal/ui/button";
import { Popover } from "@giselle-internal/ui/popover";
import { StatusBadge } from "@giselle-internal/ui/status-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@giselle-internal/ui/table";

import clsx from "clsx/lite";
import {
	Archive,
	CheckIcon,
	ChevronDownIcon,
	RefreshCw,
	Search,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

// GitHub-style search parser
interface SearchFilters {
	isOpen?: boolean;
	isArchived?: boolean;
	freeText: string;
}

function parseSearchQuery(query: string): SearchFilters {
	const filters: SearchFilters = { freeText: "" };
	const parts = query.split(/\s+/);
	const freeTextParts: string[] = [];

	for (const part of parts) {
		if (part === "is:open") {
			filters.isOpen = true;
		} else if (part === "is:archived") {
			filters.isArchived = true;
		} else if (part.trim()) {
			freeTextParts.push(part);
		}
	}

	filters.freeText = freeTextParts.join(" ");
	return filters;
}

function matchesSearchFilters(
	act: ActWithNavigation,
	filters: SearchFilters,
): boolean {
	// Check status filters
	// is:open means non-archived (currently shows all since no archived status exists)
	if (filters.isOpen) {
		// For now, all acts are considered "open" since archived status doesn't exist yet
		// This will pass through all acts when is:open is specified
	}
	if (filters.isArchived) return false; // No archived status yet, so always false

	// Check free text search
	if (filters.freeText) {
		const searchText = filters.freeText.toLowerCase();
		const matchesText =
			act.workspaceName.toLowerCase().includes(searchText) ||
			act.teamName.toLowerCase().includes(searchText);
		if (!matchesText) return false;
	}

	return true;
}

// Check if search has explicit is: filters
function hasExplicitStatusFilter(filters: SearchFilters): boolean {
	return filters.isOpen === true || filters.isArchived === true;
}

type ActWithNavigation = {
	id: string;
	status: "inProgress" | "completed" | "failed" | "cancelled";
	createdAt: string;
	workspaceName: string;
	teamName: string;
	link: string;
	llmModels?: string[]; // Array of LLM model names used
	inputValues?: string; // User input values when executing the app
};

type StatusFilter = "inProgress" | "completed" | "failed" | "cancelled";

interface FilterableActsListProps {
	acts: ActWithNavigation[];
	onReload?: () => void;
}

const statusLabels: Record<StatusFilter, string> = {
	inProgress: "Running",
	completed: "Completed",
	failed: "Failed",
	cancelled: "Cancelled",
};

const statusColors: Record<StatusFilter, string> = {
	inProgress: "bg-blue-400",
	completed: "bg-green-400",
	failed: "bg-red-400",
	cancelled: "bg-gray-400",
};

export function FilterableActsList({
	acts,
	onReload,
}: FilterableActsListProps) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("is:open");
	const [inputValue, setInputValue] = useState("");
	const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>(
		Object.keys(statusLabels) as StatusFilter[],
	);
	const [activeTab, setActiveTab] = useState<"open" | "archived">("open");

	const _statusCounts = useMemo(() => {
		const counts = acts.reduce(
			(acc, act) => {
				acc[act.status] = (acc[act.status] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);

		return {
			inProgress: counts.inProgress || 0,
			completed: counts.completed || 0,
			failed: counts.failed || 0,
			cancelled: counts.cancelled || 0,
		};
	}, [acts]);

	const filteredActs = useMemo(() => {
		const searchFilters = parseSearchQuery(searchQuery);
		const hasExplicitFilter = hasExplicitStatusFilter(searchFilters);

		return acts.filter((act) => {
			// Always check status dropdown filter first
			const matchesStatusDropdown = selectedStatuses.includes(act.status);
			if (!matchesStatusDropdown) return false;

			// If there's an explicit is: filter, use it; otherwise use tab filter
			if (hasExplicitFilter) {
				// For is:open, show all tasks (since archived doesn't exist yet)
				if (searchFilters.isOpen) {
					// Check free text search if exists
					if (searchFilters.freeText) {
						const searchText = searchFilters.freeText.toLowerCase();
						const matchesText =
							act.workspaceName.toLowerCase().includes(searchText) ||
							act.teamName.toLowerCase().includes(searchText);
						return matchesText;
					}
					return true; // Show all tasks for is:open
				}

				// For is:archived, show nothing (not implemented yet)
				if (searchFilters.isArchived) {
					return false;
				}

				// Fallback
				return matchesSearchFilters(act, searchFilters);
			} else {
				// Use tab filter when no explicit is: filter
				const matchesTab = activeTab === "open";
				if (!matchesTab) return false;

				// Check free text search only
				if (searchFilters.freeText) {
					const searchText = searchFilters.freeText.toLowerCase();
					const matchesText =
						act.workspaceName.toLowerCase().includes(searchText) ||
						act.teamName.toLowerCase().includes(searchText);
					if (!matchesText) return false;
				}

				return true;
			}
		});
	}, [acts, searchQuery, selectedStatuses, activeTab]);

	const searchTags = useMemo(() => {
		const tags = [];
		if (searchQuery.includes("is:open")) {
			tags.push({ type: "is:open", label: "is:open" });
		}
		if (searchQuery.includes("is:archived")) {
			tags.push({ type: "is:archived", label: "is:archived" });
		}
		return tags;
	}, [searchQuery]);

	const handleRemoveTag = (tagType: string) => {
		const newQuery = searchQuery.replace(tagType, "").trim();
		setSearchQuery(newQuery);
	};

	const handleTabChange = (tab: "open" | "archived") => {
		setActiveTab(tab);

		// Remove existing is: filters
		let newQuery = searchQuery.replace(/is:(open|archived)/g, "").trim();

		// Add the new filter
		const filterToAdd = `is:${tab}`;
		newQuery = newQuery ? `${filterToAdd} ${newQuery}` : filterToAdd;

		setSearchQuery(newQuery);
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			if (inputValue.trim()) {
				// Check if input contains is: filters
				if (inputValue.includes("is:")) {
					// Replace existing is: filters or add new ones
					let newQuery = searchQuery;

					// Remove existing is: filters from searchQuery
					newQuery = newQuery.replace(/is:(open|archived)/g, "").trim();

					// Add new input
					newQuery = newQuery
						? `${inputValue.trim()} ${newQuery}`
						: inputValue.trim();

					setSearchQuery(newQuery);
				} else {
					// Regular text search
					const newQuery = `${searchQuery} ${inputValue.trim()}`.trim();
					setSearchQuery(newQuery);
				}
			} else {
				// Clear search when input is empty and Enter is pressed
				setSearchQuery("is:open");
			}
			setInputValue("");
		} else if (
			e.key === "Backspace" &&
			inputValue === "" &&
			searchTags.length > 0
		) {
			// Handle backspace on tags
			const lastTag = searchTags[searchTags.length - 1];

			if (lastTag.type.startsWith("is:")) {
				// For is: tags, convert back to editable text instead of removing completely
				const prefix = lastTag.type.split(":")[0]; // "is"
				handleRemoveTag(lastTag.type);
				setInputValue(`${prefix}:`);
			} else {
				// Remove the last tag completely
				handleRemoveTag(lastTag.type);
			}
		} else if (
			e.key === "Backspace" &&
			inputValue.startsWith("is:") &&
			inputValue.length <= 3
		) {
			// Prevent deleting "is:" part
			e.preventDefault();
		}
	};

	// Handle input change and auto-convert is: filters to tags
	const _handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);

		// Auto-convert complete is: filters to searchQuery
		if (
			value.endsWith(" ") &&
			(value.includes("is:open") || value.includes("is:archived"))
		) {
			const newQuery = `${searchQuery} ${value.trim()}`.trim();
			setSearchQuery(newQuery);
			setInputValue("");
		}
	};

	const handleReload = () => {
		if (onReload) {
			onReload();
		} else {
			window.location.reload();
		}
	};

	// Sync activeTab with searchQuery
	useEffect(() => {
		if (searchQuery.includes("is:archived")) {
			setActiveTab("archived");
		} else if (searchQuery.includes("is:open")) {
			setActiveTab("open");
		}
	}, [searchQuery]);

	// Add custom styles for select components to match /stage page
	useEffect(() => {
		const styleId = "acts-select-styles";
		let styleElement = document.getElementById(styleId);

		if (!styleElement) {
			styleElement = document.createElement("style");
			styleElement.id = styleId;
			styleElement.textContent = `
				        .status-select button[type="button"] {
				          background-color: rgba(255, 255, 255, 0.05) !important;
				          border: none !important;
				          color: white !important;
				          font-size: 14px !important;
				          font-family: inherit !important;
				        }
				        .status-select button[type="button"]:hover {
				          background-color: rgba(255, 255, 255, 0.1) !important;
				        }

				      `;
			document.head.appendChild(styleElement);
		}

		return () => {
			const existingStyle = document.getElementById(styleId);
			if (existingStyle) {
				document.head.removeChild(existingStyle);
			}
		};
	}, []);

	return (
		<div className="flex-1 px-[24px] bg-[var(--color-stage-background)] pt-16 md:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 h-full flex flex-col">
			<div className="py-6 h-full flex flex-col">
				<div className="flex items-center justify-between px-1 mb-6">
					<div>
						<h1
							className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)] mb-2"
							style={{
								textShadow:
									"0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
							}}
						>
							Tasks
						</h1>
						<p className="text-sm text-black-400">
							View and manage all your running and completed tasks
						</p>
					</div>
				</div>

				{/* Filters */}
				<div className="flex flex-col md:flex-row gap-4 mb-6">
					{/* Search */}
					<div className="search-input relative flex-1">
						<div
							className="flex items-center gap-1 flex-wrap w-full pl-2 pr-10 py-1 rounded-[8px] h-10 text-white-900 placeholder-white-600 focus-within:outline-none transition-colors text-[14px]"
							style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
						>
							{searchTags.map((tag) => {
								const [prefix, value] = tag.label.split(":");
								return (
									<div
										key={tag.type}
										className="inline-flex items-center gap-1"
									>
										<span className="text-white-700 text-xs">{prefix}:</span>
										<span className="inline-flex items-center px-2 py-0.5 bg-blue-600 text-white text-xs rounded-md">
											{value}
											<button
												type="button"
												onClick={() => handleRemoveTag(tag.type)}
												className="hover:bg-blue-700 rounded-full w-3 h-3 flex items-center justify-center text-[10px] leading-none"
											>
												×
											</button>
										</span>
									</div>
								);
							})}
							<input
								type="text"
								placeholder={
									searchTags.length === 0
										? "Search tasks... (try: is:open, workspace name)"
										: "Search..."
								}
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={handleInputKeyDown}
								className="flex-1 min-w-0 bg-transparent border-none outline-none text-white-900 placeholder-white-600 text-[14px]"
							/>
						</div>
						<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white-600" />
					</div>

					{/* Status Filter */}
					<div className="status-select">
						<Popover
							trigger={
								<button
									type="button"
									className={clsx(
										"flex items-center gap-2 rounded-[8px] h-10 px-[12px] text-left text-[14px]",
										"outline-none focus:outline-none",
										"transition-colors",
									)}
								>
									<div className="flex items-center gap-1">
										<span className="text-text">
											Status {selectedStatuses.length}/
											{Object.keys(statusLabels).length}
										</span>
										<div className="flex -space-x-1">
											{selectedStatuses.map((status) => (
												<div
													key={status}
													className={`w-3 h-3 rounded-full border border-black-900 ${statusColors[status]}`}
												/>
											))}
										</div>
									</div>
									<ChevronDownIcon className="size-[13px] shrink-0 text-text" />
								</button>
							}
						>
							{Object.entries(statusLabels).map(([status, label]) => {
								const isSelected = selectedStatuses.includes(
									status as StatusFilter,
								);
								return (
									<button
										type="button"
										key={status}
										onClick={() => {
											const statusKey = status as StatusFilter;
											setSelectedStatuses((prev) =>
												isSelected
													? prev.filter((s) => s !== statusKey)
													: [...prev, statusKey],
											);
										}}
										className={clsx(
											"w-full text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
											"rounded-[4px] px-[8px] py-[6px] text-[14px]",
											"flex items-center justify-between gap-[4px]",
										)}
									>
										<div className="flex items-center gap-2">
											<div
												className={`w-3 h-3 rounded-full ${statusColors[status as StatusFilter]}`}
											/>
											<span>{label}</span>
										</div>
										<CheckIcon
											className={clsx(
												"size-[13px]",
												isSelected ? "text-text" : "text-transparent",
											)}
										/>
									</button>
								);
							})}
						</Popover>
					</div>

					{/* New Task Button */}
					<div>
						<Link href="/stage">
							<Button variant="glass" size="large" className="h-10 px-4">
								<div className="flex items-center gap-2">
									<Sparkles className="w-4 h-4" />
									<span className="text-sm">New task</span>
								</div>
							</Button>
						</Link>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto">
					{filteredActs.length === 0 && acts.length > 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center">
							<div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-4">
								<Search className="w-8 h-8 text-gray-400" />
							</div>
							<h2 className="text-lg font-medium text-white-100 mb-2">
								No tasks match your filters
							</h2>
							<p className="text-sm text-white-700 mb-6 max-w-sm">
								Try adjusting your search or filter criteria.
							</p>
							<button
								type="button"
								onClick={() => {
									setSearchQuery("");
									setInputValue("");
									setSelectedStatuses(
										Object.keys(statusLabels) as StatusFilter[],
									);
								}}
								className="px-4 py-2 bg-white/10 text-white-900 rounded-lg hover:bg-white/20 transition-colors"
							>
								Clear filters
							</button>
						</div>
					) : filteredActs.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center">
							<div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-4">
								<span className="text-2xl text-gray-400">📝</span>
							</div>
							<h2 className="text-lg font-medium text-white-100 mb-2">
								No tasks yet
							</h2>
							<p className="text-sm text-white-700 mb-6 max-w-sm">
								Start by creating your first task from the main stage page.
							</p>
							<Link href="/stage">
								<Button variant="solid">Create New Task</Button>
							</Link>
						</div>
					) : (
						<Table className="table-fixed w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="w-[292px] text-white-100">
										<div className="flex items-center gap-6">
											<button
												type="button"
												onClick={() => handleTabChange("open")}
												className={`pb-1 text-xs font-medium transition-colors ${
													activeTab === "open"
														? "text-white-100"
														: "text-gray-600 hover:text-gray-500"
												}`}
											>
												<span className="flex items-center gap-2">
													Open
													<span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs font-semibold">
														{acts.length}
													</span>
												</span>
											</button>
											<button
												type="button"
												onClick={() => handleTabChange("archived")}
												className={`pb-1 text-xs font-medium transition-colors ${
													activeTab === "archived"
														? "text-white-100"
														: "text-gray-600 hover:text-gray-500"
												}`}
											>
												<span className="flex items-center gap-2">
													Archived
													<span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs font-semibold">
														0
													</span>
												</span>
											</button>
										</div>
									</TableHead>
									<TableHead className="w-[180px] text-white-100">
										LLM Models
									</TableHead>
									<TableHead className="w-[200px] text-white-100">
										Input Values
									</TableHead>
									<TableHead className="w-32 text-center text-white-100">
										Status
									</TableHead>
									<TableHead className="w-20 text-right text-white-100">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredActs.map((act) => {
									return (
										<TableRow
											key={act.id}
											className="hover:bg-white/5 transition-colors duration-200 cursor-pointer"
											onClick={() => {
												router.push(act.link);
											}}
										>
											<TableCell className="w-[292px]">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
														<span className="text-sm text-gray-400">App</span>
													</div>
													<div className="flex flex-col min-w-0">
														<span className="truncate font-medium text-white-100">
															{act.workspaceName}
														</span>
														<span className="text-sm text-black-600 truncate">
															{new Date(act.createdAt)
																.toISOString()
																.slice(0, 19)
																.replace("T", " ")}{" "}
															· {act.teamName}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell className="w-[180px]">
												{act.llmModels && act.llmModels.length > 0 ? (
													<div className="flex gap-1 flex-wrap">
														{act.llmModels.slice(0, 2).map((model) => (
															<span
																key={model}
																className="px-2 py-1 text-xs text-white-700 rounded-full border border-gray-600"
															>
																{model}
															</span>
														))}
														{act.llmModels.length > 2 && (
															<span className="px-2 py-1 text-xs text-white-700 rounded-full border border-gray-600">
																+{act.llmModels.length - 2}
															</span>
														)}
													</div>
												) : (
													<span className="text-xs text-white-500">-</span>
												)}
											</TableCell>
											<TableCell className="w-[200px]">
												{act.inputValues ? (
													<span className="text-sm text-white-700 line-clamp-2">
														{act.inputValues}
													</span>
												) : (
													<span className="text-xs text-white-500">-</span>
												)}
											</TableCell>
											<TableCell className="text-center w-32">
												<div className="flex items-center justify-center gap-2">
													{act.status === "inProgress" && (
														<StatusBadge status="info" variant="dot">
															Running
														</StatusBadge>
													)}
													{act.status === "completed" && (
														<StatusBadge status="success" variant="dot">
															Completed
														</StatusBadge>
													)}
													{act.status === "failed" && (
														<StatusBadge status="error" variant="dot">
															Failed
														</StatusBadge>
													)}
													{act.status === "cancelled" && (
														<StatusBadge status="ignored" variant="dot">
															Cancelled
														</StatusBadge>
													)}
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															handleReload();
														}}
														className="text-white-700 hover:text-white-900 transition-colors p-1 rounded"
														title="Reload this task"
													>
														<RefreshCw className="w-3 h-3" />
													</button>
												</div>
											</TableCell>
											<TableCell className="text-right w-20">
												<div className="flex justify-end items-center gap-2">
													<button
														type="button"
														className="text-white-700 hover:text-white-900 transition-colors p-1"
														title="Archive task"
														onClick={(e) => {
															e.stopPropagation();
															// TODO: Implement archive functionality
															alert(`Archive task: ${act.workspaceName}`);
														}}
													>
														<Archive className="w-4 h-4" />
													</button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					)}
				</div>
			</div>
		</div>
	);
}
