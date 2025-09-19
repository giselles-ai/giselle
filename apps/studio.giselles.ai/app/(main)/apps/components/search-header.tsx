"use client";

import { Input } from "@giselle-internal/ui/input";
import { Select, type SelectOption } from "@giselle-internal/ui/select";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	Clock,
	LayoutGrid,
	LayoutList,
	Search,
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
 * Shared header identical to /apps top controls:
 * - Left: search input with leading icon
 * - Right: sort dropdown (+ optional grid/list toggle)
 */
export function SearchHeader({
	searchQuery,
	onSearchChange,
	searchPlaceholder = "Search Apps...",
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
			<div className="relative flex-1 w-full">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black-300 h-4 w-4" />
				<Input
					type="text"
					placeholder={searchPlaceholder}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					// Classes match /apps usage exactly (force radius/ring like /apps local Input)
					className="pl-12 pr-4 h-10 w-full bg-black-700/50 text-white placeholder:text-black-400 border-black-600 rounded-[8px] shadow-none focus:border-transparent focus:ring-1 focus:ring-black--50 focus:ring-inset focus:ring-offset-0 focus-visible:border-transparent focus-visible:ring-1 focus-visible:ring-black--50 focus-visible:ring-inset focus-visible:ring-offset-0"
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
					triggerClassName={selectTextClassName}
				/>

				{/* Optional view toggle */}
				{canToggleView ? (
					<div className="flex rounded-lg border border-black-600 overflow-hidden shrink-0">
						<button
							type="button"
							onClick={() => onViewModeChange?.("grid")}
							className={`p-3 flex items-center justify-center transition-colors ${
								viewMode === "grid"
									? "bg-black-600 text-white"
									: "bg-black-700/50 text-black-300 hover:text-white"
							}`}
							aria-label="Grid view"
						>
							<LayoutGrid className="h-4 w-4" />
						</button>
						<div className="w-px bg-black-600" />
						<button
							type="button"
							onClick={() => onViewModeChange?.("list")}
							className={`p-3 flex items-center justify-center transition-colors ${
								viewMode === "list"
									? "bg-black-600 text-white"
									: "bg-black-700/50 text-black-300 hover:text-white"
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
