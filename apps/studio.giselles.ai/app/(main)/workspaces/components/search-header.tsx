"use client";

import { SearchInput } from "@giselle-internal/ui/search-input";
import { Select, type SelectOption } from "@giselle-internal/ui/select";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	Clock,
	LayoutGrid,
	LayoutList,
} from "lucide-react";
import { useMemo } from "react";

type SortOption = "name-asc" | "name-desc" | "date-desc" | "date-asc";
type ViewMode = "grid" | "list";

interface SearchHeaderProps {
	// search
	searchQuery: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder?: string;

	// sort
	sortOption: SortOption;
	onSortChange: (value: SortOption) => void;

	// optional view toggle (grid/list)
	showViewToggle?: boolean;
	viewMode?: ViewMode;
	onViewModeChange?: (mode: ViewMode) => void;

	className?: string;
	selectTextClassName?: string;
}

/**
 * SearchHeader
 * Shared header identical to /workspaces top controls:
 * - Left: search input with leading icon
 * - Right: sort dropdown (+ optional grid/list toggle)
 */
export function SearchHeader({
	searchQuery,
	onSearchChange,
	searchPlaceholder = "Search Workspaces...",
	sortOption,
	onSortChange,
	showViewToggle = true,
	viewMode,
	onViewModeChange,
	className,
	selectTextClassName = "text-text",
}: SearchHeaderProps) {
	const canToggleView =
		showViewToggle && viewMode != null && !!onViewModeChange;

	const sortOptions: Array<SelectOption> = useMemo(
		() => [
			{
				value: "date-desc",
				label: "Updated",
				icon: <Clock className="h-4 w-4" />,
			},
			{
				value: "date-asc",
				label: "Oldest",
				icon: <Clock className="h-4 w-4" />,
			},
			{
				value: "name-asc",
				label: "Name (A-Z)",
				icon: <ArrowDownAZ className="h-4 w-4" />,
			},
			{
				value: "name-desc",
				label: "Name (Z-A)",
				icon: <ArrowUpAZ className="h-4 w-4" />,
			},
		],
		[],
	);

	return (
		<div
			className={[
				"mb-3 flex flex-col sm:flex-row gap-3 items-center",
				className,
			]
				.filter(Boolean)
				.join(" ")}
		>
			{/* Search */}
			<div className="flex-1 w-full">
				<SearchInput
					placeholder={searchPlaceholder}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="text-inverse"
				/>
			</div>

			{/* Right cluster */}
			<div className="flex gap-2">
				{/* Sort */}
				<Select
					options={sortOptions}
					placeholder="Sort"
					value={sortOption}
					onValueChange={(value) => onSortChange(value as SortOption)}
					widthClassName="w-auto"
					triggerClassName={selectTextClassName}
				/>

				{/* Optional view toggle */}
				{canToggleView ? (
					<div className="flex rounded-lg border border-border overflow-hidden shrink-0">
						<button
							type="button"
							onClick={() => onViewModeChange?.("grid")}
							className={`p-3 flex items-center justify-center transition-colors ${
								viewMode === "grid"
									? "bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse"
									: "bg-transparent text-text/60 hover:bg-surface/5 hover:text-inverse"
							}`}
							aria-label="Grid view"
						>
							<LayoutGrid className="h-4 w-4" />
						</button>
						<button
							type="button"
							onClick={() => onViewModeChange?.("list")}
							className={`p-3 flex items-center justify-center transition-colors ${
								viewMode === "list"
									? "bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse"
									: "bg-transparent text-text/60 hover:bg-surface/5 hover:text-inverse"
							}`}
							aria-label="List view"
						>
							<LayoutList className="h-4 w-4" />
						</button>
					</div>
				) : null}
			</div>
		</div>
	);
}
