import type { LanguageModel } from "@giselle-sdk/language-model";
import { useEffect, useState } from "react";

export function useHoverState() {
	const [hoveredModel, setHoveredModel] = useState<LanguageModel | null>(null);
	const [capabilityPanelHovered, setCapabilityPanelHovered] = useState(false);
	const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

	// Cleanup timeout on unmount to prevent memory leaks
	useEffect(() => {
		return () => {
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
			}
		};
	}, [hoverTimeout]);

	const handleModelHover = (model: LanguageModel) => {
		// Clear any existing timeout
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			setHoverTimeout(null);
		}
		setHoveredModel(model);
	};

	const handleModelLeave = () => {
		// Set a timeout to allow mouse movement to capability panel
		const timeout = setTimeout(() => {
			// Only clear if capability panel is not being hovered
			if (!capabilityPanelHovered) {
				setHoveredModel(null);
			}
		}, 150); // Reduced from 300ms for more responsive feel
		setHoverTimeout(timeout);
	};

	const handleCapabilityPanelEnter = () => {
		// Clear any pending timeout when entering capability panel
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			setHoverTimeout(null);
		}
		setCapabilityPanelHovered(true);
	};

	const handleCapabilityPanelLeave = () => {
		setCapabilityPanelHovered(false);
		// Immediately clear the hovered model when leaving capability panel
		setHoveredModel(null);
	};

	return {
		hoveredModel,
		capabilityPanelHovered,
		handleModelHover,
		handleModelLeave,
		handleCapabilityPanelEnter,
		handleCapabilityPanelLeave,
	};
}
