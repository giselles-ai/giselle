import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FilterType, TeamId, TeamOption } from "../types";

// localStorage keys for persisting user preferences
const STORAGE_KEYS = {
	TEAM_ID: "giselle-stage-selected-team",
	FILTER: "giselle-stage-selected-filter",
} as const;

// Safe localStorage access (SSR compatible)
function getStorageItem(key: string): string | null {
	if (typeof window === "undefined") return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function setStorageItem(key: string, value: string): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, value);
	} catch {
		// Silently fail if localStorage is not available
	}
}

interface UseFilterStateProps {
	teamOptions: TeamOption[];
}

export function useFilterState({ teamOptions }: UseFilterStateProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Get URL parameters
	const urlTeamId = searchParams.get("teamId");
	const urlFilter = searchParams.get("filter") as FilterType;

	// Determine default team ID (URL > first available, localStorage loaded in useEffect)
	const defaultTeamId = useMemo(() => {
		if (urlTeamId && teamOptions.some((team) => team.value === urlTeamId)) {
			return urlTeamId as TeamId;
		}
		return teamOptions[0]?.value;
	}, [teamOptions, urlTeamId]);

	// Determine default filter (URL > 'all', localStorage loaded in useEffect)
	const defaultFilter = urlFilter || "all";

	// State
	const [selectedTeamId, setSelectedTeamId] = useState<TeamId>(defaultTeamId);
	const [selectedFilter, setSelectedFilter] =
		useState<FilterType>(defaultFilter);

	// Load saved preferences from localStorage on client-side mount
	useEffect(() => {
		// Only run if no URL parameters override the defaults
		if (!urlTeamId) {
			const savedTeamId = getStorageItem(STORAGE_KEYS.TEAM_ID);
			if (
				savedTeamId &&
				teamOptions.some((team) => team.value === savedTeamId)
			) {
				setSelectedTeamId(savedTeamId as TeamId);
			}
		}

		if (!urlFilter) {
			const savedFilterRaw = getStorageItem(STORAGE_KEYS.FILTER);
			const allowedFilters: ReadonlyArray<FilterType> = [
				"all",
				"history",
				"latest",
				"favorites",
			];
			if (
				savedFilterRaw &&
				(allowedFilters as ReadonlyArray<string>).includes(savedFilterRaw)
			) {
				setSelectedFilter(savedFilterRaw as FilterType);
			}
		}
	}, [teamOptions, urlTeamId, urlFilter]);

	// Persist selections to localStorage
	useEffect(() => {
		if (selectedTeamId) {
			setStorageItem(STORAGE_KEYS.TEAM_ID, selectedTeamId);
		}
	}, [selectedTeamId]);

	useEffect(() => {
		setStorageItem(STORAGE_KEYS.FILTER, selectedFilter);
	}, [selectedFilter]);

	// Navigation handlers
	const handleFilterChange = useCallback(
		(newFilter: FilterType) => {
			const params = new URLSearchParams(searchParams);
			params.set("filter", newFilter);
			router.push(`/stage?${params.toString()}`);
		},
		[router, searchParams],
	);

	const handleTeamChange = useCallback(
		(newTeamId: TeamId) => {
			const params = new URLSearchParams(searchParams);
			params.set("teamId", newTeamId);
			router.push(`/stage?${params.toString()}`);
		},
		[router, searchParams],
	);

	return {
		selectedTeamId,
		setSelectedTeamId,
		selectedFilter,
		setSelectedFilter,
		handleFilterChange,
		handleTeamChange,
	};
}
