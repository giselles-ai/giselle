import type { FlowTriggerId } from "@giselle-sdk/data-type";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { FlowTriggerUIItem, ValidationErrors } from "../types";

interface UseFormStateProps {
	filteredFlowTriggers: FlowTriggerUIItem[];
}

export function useFormState({ filteredFlowTriggers }: UseFormStateProps) {
	const searchParams = useSearchParams();
	const urlWorkspaceId = searchParams.get("workspaceId");

	const [userSelectedId, setUserSelectedId] = useState<
		FlowTriggerId | undefined
	>(undefined);
	const [hasUserInteracted, setHasUserInteracted] = useState(false);
	const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
		{},
	);

	// Calculate auto-selected ID during render
	const autoSelectedId = useMemo(() => {
		if (filteredFlowTriggers.length === 0) return undefined;

		// First priority: URL workspace ID
		if (urlWorkspaceId) {
			const matchingTrigger = filteredFlowTriggers.find(
				(trigger) => trigger.sdkData.workspaceId === urlWorkspaceId,
			);
			if (matchingTrigger) return matchingTrigger.id;
		}

		// Second priority: First available app
		return filteredFlowTriggers[0].id;
	}, [filteredFlowTriggers, urlWorkspaceId]);

	// Use user selection if they've interacted, otherwise use auto-selection
	const selectedFlowTriggerId = hasUserInteracted
		? userSelectedId
		: autoSelectedId;

	const selectedTrigger = useMemo(
		() =>
			filteredFlowTriggers.find(
				(flowTrigger) => flowTrigger.id === selectedFlowTriggerId,
			),
		[filteredFlowTriggers, selectedFlowTriggerId],
	);

	const handleFlowTriggerSelect = (triggerId: FlowTriggerId) => {
		setHasUserInteracted(true);
		// Use selectedFlowTriggerId for toggle logic to handle auto-selected items
		if (selectedFlowTriggerId === triggerId) {
			setUserSelectedId(undefined);
		} else {
			setUserSelectedId(triggerId);
		}
	};

	const handleFlowTriggerDeselect = () => {
		setHasUserInteracted(true);
		setUserSelectedId(undefined);
	};

	// Create a stable ref that updates its current value each render
	const userHasSelectedRef = useRef<boolean>(false);
	userHasSelectedRef.current = hasUserInteracted;

	return {
		selectedFlowTriggerId,
		setSelectedFlowTriggerId: (id?: FlowTriggerId) => {
			setHasUserInteracted(true);
			setUserSelectedId(id);
		},
		selectedTrigger,
		validationErrors,
		setValidationErrors,
		userHasSelectedRef,
		handleFlowTriggerSelect,
		handleFlowTriggerDeselect,
	};
}
