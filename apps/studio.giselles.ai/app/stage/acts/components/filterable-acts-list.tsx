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
import { Card } from "../../../(main)/settings/components/card";
import { PageHeader } from "../../../ui/page-header";
import { AppIcon } from "../../(top)/app-icon";
import { IconAction } from "../../ui/icon-action";
import type { ActWithNavigation, StatusFilter } from "../types";

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

interface FilterableActsListProps {
	acts: ActWithNavigation[];
	onReload?: () => void;
	onArchive?: (act: ActWithNavigation) => void;
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
	onArchive,
}: FilterableActsListProps) {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("is:open");
	const [inputValue, setInputValue] = useState("");
	const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>(
		Object.keys(statusLabels) as StatusFilter[],
	);
	const [activeTab, setActiveTab] = useState<"open" | "archived">("open");

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

	const handleReload = () => {
		if (onReload) {
			onReload();
		} else {
			window.location.reload();
		}
	};
	const archive = onArchive ?? (() => {});

	// Sync activeTab with searchQuery
	useEffect(() => {
		if (searchQuery.includes("is:archived")) {
			setActiveTab("archived");
		} else if (searchQuery.includes("is:open")) {
			setActiveTab("open");
		}
	}, [searchQuery]);

	return (
		<div className="flex-1 px-[24px] bg-[var(--color-stage-background)] pt-16 md:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 h-full flex flex-col">
			<div className="py-6 h-full flex flex-col">
				<div className="flex items-center justify-between px-1 mb-6">
					<div>
						<PageHeader
							title="Tasks"
							subtitle="View and manage all your running and completed tasks"
						/>
					</div>
				</div>

				{/* Filters */}
				<div className="flex flex-col md:flex-row gap-4 mb-6">
					{/* Search */}
					<div className="search-input relative flex-1 w-full">
						<div className="flex items-center gap-1 flex-wrap w-full pl-12 pr-4 h-10 bg-ghost-element text-text placeholder:text-text-muted border border-border rounded-[8px] shadow-none focus-within:border-transparent focus-within:ring-1 focus-within:ring-black--50 focus-within:ring-inset focus-within:ring-offset-0 text-[14px]">
							{searchTags.map((tag) => {
								const [prefix, value] = tag.label.split(":");
								return (
									<div
										key={tag.type}
										className="inline-flex items-center gap-1"
									>
										<span className="text-text-muted text-xs">{prefix}:</span>
										<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-100/20 text-primary-100 text-xs">
											{value}
											<button
												type="button"
												onClick={() => handleRemoveTag(tag.type)}
												className="rounded-full w-3 h-3 flex items-center justify-center text-[10px] leading-none text-primary-100 hover:bg-primary-100/30"
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
								className="flex-1 min-w-0 bg-transparent border-none outline-none text-text placeholder:text-[var(--color-tabs-inactive-text)] text-[14px]"
							/>
						</div>
						<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-4 w-4" />
					</div>

					{/* Status Filter and New Task Button Row */}
					<div className="flex flex-row gap-4 md:flex-shrink-0">
						{/* Status Filter */}
						<div className="status-select flex-1">
							<Popover
								trigger={
									<button
										type="button"
										className={clsx(
											"w-full flex justify-between items-center rounded-[8px] h-10 px-[12px] text-left text-[14px]",
											"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
											"bg-white/5 transition-colors hover:bg-ghost-element-hover",
											"data-[placeholder]:text-text-muted",
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
														className={`w-3 h-3 rounded-full border border-border ${statusColors[status]}`}
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
				</div>

				<div className="flex-1 overflow-y-auto">
					{filteredActs.length === 0 && acts.length > 0 ? (
						<div className="flex justify-center items-center h-full mt-12">
							<div className="grid gap-[8px] justify-center text-center">
								<h3 className="text-[18px] font-geist font-bold text-[var(--color-tabs-inactive-text)]">
									No tasks found.
								</h3>
								<p className="text-[12px] font-geist text-[var(--color-tabs-inactive-text)]">
									Try searching with a different keyword.
								</p>
							</div>
						</div>
					) : filteredActs.length === 0 ? (
						<div className="flex justify-center items-center h-full mt-12">
							<div className="grid gap-[8px] justify-center text-center">
								<h3 className="text-[18px] font-geist font-bold text-[var(--color-tabs-inactive-text)]">
									No tasks yet.
								</h3>
								<p className="text-[12px] font-geist text-[var(--color-tabs-inactive-text)]">
									Start by creating your first task from the main stage page.
								</p>
							</div>
						</div>
					) : (
						<Card className="gap-0 py-2 overflow-x-auto">
							<Table className="table-fixed w-full">
								<TableHeader>
									<TableRow>
										<TableHead className="text-text w-auto max-w-96">
											<div className="flex items-center gap-6">
												<button
													type="button"
													onClick={() => handleTabChange("open")}
													className={`pb-1 text-xs font-medium transition-colors ${
														activeTab === "open"
															? "text-text"
															: "text-text-muted hover:text-text"
													}`}
												>
													<span className="flex items-center gap-2">
														Open
														<span className="bg-ghost-element text-text-muted px-2 py-0.5 rounded-full text-xs font-semibold">
															{acts.length}
														</span>
													</span>
												</button>
												<button
													type="button"
													onClick={() => handleTabChange("archived")}
													className={`pb-1 text-xs font-medium transition-colors ${
														activeTab === "archived"
															? "text-text"
															: "text-text-muted hover:text-text"
													}`}
												>
													<span className="flex items-center gap-2">
														Archived
														<span className="bg-ghost-element text-text-muted px-2 py-0.5 rounded-full text-xs font-semibold">
															0
														</span>
													</span>
												</button>
											</div>
										</TableHead>
										<TableHead className="text-text w-auto hidden md:table-cell">
											LLM Models
										</TableHead>
										<TableHead className="text-text w-auto max-w-80 hidden md:table-cell">
											Input Values
										</TableHead>
										<TableHead className="text-center text-text w-24">
											Status
										</TableHead>
										<TableHead className="text-right text-text w-20 hidden md:table-cell">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredActs.map((act) => {
										return (
											<TableRow
												key={act.id}
												className="group transition-colors duration-200 cursor-pointer last:border-b-0"
												onClick={() => {
													router.push(act.link);
												}}
											>
												<TableCell className="w-auto max-w-96">
													<div className="flex items-center gap-3">
														<div className="w-9 h-9 rounded-full bg-ghost-element flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-primary-100/20">
															<AppIcon className="h-5 w-5 text-text-muted transition-colors group-hover:text-primary-100" />
														</div>
														<div className="flex flex-col min-w-0">
															<span className="truncate font-medium text-text">
																{act.workspaceName}
															</span>
															<span className="text-sm text-text-muted truncate">
																{new Date(act.createdAt)
																	.toISOString()
																	.slice(0, 19)
																	.replace("T", " ")}{" "}
																· {act.teamName}
															</span>
														</div>
													</div>
												</TableCell>
												<TableCell className="w-auto hidden md:table-cell">
													{act.llmModels && act.llmModels.length > 0 ? (
														<div className="flex gap-1 flex-wrap">
															{act.llmModels.slice(0, 2).map((model) => (
																<span
																	key={model}
																	className="px-2 py-1 text-xs text-text-muted rounded-full border border-border"
																>
																	{model}
																</span>
															))}
															{act.llmModels.length > 2 && (
																<span className="px-2 py-1 text-xs text-text-muted rounded-full border border-border">
																	+{act.llmModels.length - 2}
																</span>
															)}
														</div>
													) : (
														<span className="text-xs text-text-muted">-</span>
													)}
												</TableCell>
												<TableCell className="w-auto max-w-80 hidden md:table-cell">
													{act.inputValues ? (
														<span className="text-sm text-text-muted line-clamp-2">
															{act.inputValues}
														</span>
													) : (
														<span className="text-xs text-text-muted">-</span>
													)}
												</TableCell>
												<TableCell className="text-center w-24">
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
													</div>
												</TableCell>
												<TableCell className="text-right w-20 hidden md:table-cell">
													<div className="flex justify-end items-center gap-2">
														{act.status === "failed" ? (
															<IconAction
																variant="fill"
																rounded="md"
																iconSize="sm"
																title="Reload this task"
																onClick={(
																	e: React.MouseEvent<HTMLButtonElement>,
																) => {
																	e.stopPropagation();
																	handleReload();
																}}
															>
																<RefreshCw />
															</IconAction>
														) : (
															<IconAction
																variant="fill-subtle"
																rounded="md"
																iconSize="sm"
																title="Archive task"
																onClick={(
																	e: React.MouseEvent<HTMLButtonElement>,
																) => {
																	e.stopPropagation();
																	archive(act);
																}}
															>
																<Archive />
															</IconAction>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
