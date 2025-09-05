"use client";

import "@xyflow/react/dist/style.css";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { useAnimationFrame, useSpring } from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { V2Placeholder } from "./v2";

export function Editor({
	isReadOnly = false,
	userRole = "viewer",
	onFlowNameChange,
}: {
	isReadOnly?: boolean;
	userRole?: "viewer" | "guest" | "editor" | "owner";
	onFlowNameChange?: (name: string) => Promise<void>;
}) {
	const { data } = useWorkflowDesigner();
	const selectedNodes = useMemo(
		() =>
			Object.entries(data.ui.nodeState)
				.filter(([_, nodeState]) => nodeState?.selected)
				.map(([nodeId]) => data.nodes.find((node) => node.id === nodeId))
				.filter((node) => node !== undefined),
		[data],
	);
	const rightPanelRef = useRef<ImperativePanelHandle>(null);
	const rightPanelWidthMotionValue = useSpring(0, {
		stiffness: 500,
		damping: 50,
		mass: 1,
	});
	const expand = useRef(false);
	const collapse = useRef(false);

	// Convert 280px to percentage value
	const getPercentageForPixels = useCallback((pixels: number) => {
		const containerWidth = window.innerWidth - 16 - 16; // subtract padding
		const sideMenuWidth = containerWidth * 0.1; // side menu takes 10%
		const availableWidth = containerWidth - sideMenuWidth;
		return (pixels / availableWidth) * 100;
	}, []);

	useEffect(() => {
		if (!rightPanelRef.current) {
			return;
		}
		if (selectedNodes.length === 1) {
			expand.current = true;
			const targetPercentage = getPercentageForPixels(280);
			rightPanelWidthMotionValue.set(targetPercentage);
			rightPanelRef.current.resize(targetPercentage);
		} else {
			collapse.current = true;
			rightPanelWidthMotionValue.set(0);
			rightPanelRef.current.resize(0);
		}
	}, [
		selectedNodes.length,
		rightPanelWidthMotionValue,
		getPercentageForPixels,
	]);

	useAnimationFrame(() => {
		if (!rightPanelRef.current) {
			return;
		}
		const rightPanelWidth = rightPanelWidthMotionValue.get();
		if (expand.current) {
			rightPanelRef.current.resize(rightPanelWidth);
			const targetPercentage = getPercentageForPixels(280);
			if (Math.abs(rightPanelWidth - targetPercentage) < 0.1) {
				expand.current = false;
				collapse.current = false;
			}
		} else if (collapse.current) {
			rightPanelRef.current.resize(rightPanelWidth);
			if (rightPanelWidth === 0) {
				expand.current = false;
				collapse.current = false;
			}
		} else {
			rightPanelWidthMotionValue.jump(rightPanelRef.current.getSize());
		}
	});

	return (
		<V2Placeholder
			isReadOnly={isReadOnly}
			userRole={userRole}
			onNameChange={onFlowNameChange}
		/>
	);
}
