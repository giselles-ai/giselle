import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { FilterType, TeamId, TeamOption } from "../types";

interface UseFilterStateProps {
	teamOptions: TeamOption[];
}

export function useFilterState({ teamOptions }: UseFilterStateProps) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Get URL parameters
	const urlTeamId = searchParams.get("teamId");
	const urlFilter = searchParams.get("filter") as FilterType;

	// Determine default team ID
	const defaultTeamId = useMemo(() => {
		if (urlTeamId && teamOptions.some((team) => team.value === urlTeamId)) {
			return urlTeamId as TeamId;
		}
		return teamOptions[0]?.value;
	}, [teamOptions, urlTeamId]);

	// State
	const [selectedTeamId, setSelectedTeamId] = useState<TeamId>(defaultTeamId);
	const [selectedFilter, setSelectedFilter] = useState<FilterType>(
		urlFilter || "all",
	);

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
