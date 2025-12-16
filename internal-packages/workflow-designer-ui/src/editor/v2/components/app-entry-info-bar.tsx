"use client";

import { useWorkflowDesignerStore } from "@giselles-ai/react";
import { InfoIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";

export function AppEntryInfoBar() {
	const [isRequestAcknowledged, setIsRequestAcknowledged] = useState(false);
	const [isResponseAcknowledged, setIsResponseAcknowledged] = useState(false);

	const { hasAppEntry, hasEnd, isAppEntryConfigured } =
		useWorkflowDesignerStore(
			useShallow((s) => {
				const nodes = s.workspace.nodes;
				const appEntryNode = nodes.find((n) => n.content.type === "appEntry");
				return {
					hasAppEntry: nodes.some((n) => n.content.type === "appEntry"),
					hasEnd: nodes.some((n) => n.content.type === "end"),
					isAppEntryConfigured:
						appEntryNode?.content.type === "appEntry" &&
						appEntryNode.content.status === "configured",
				};
			}),
		);

	useEffect(() => {
		if (!hasAppEntry) {
			setIsRequestAcknowledged(false);
			setIsResponseAcknowledged(false);
		}
	}, [hasAppEntry]);

	useEffect(() => {
		if (!hasEnd) {
			setIsResponseAcknowledged(false);
		}
	}, [hasEnd]);

	// Once Stage Request is configured, advance automatically.
	useEffect(() => {
		if (isAppEntryConfigured) {
			setIsRequestAcknowledged(true);
		}
	}, [isAppEntryConfigured]);

	const messageType = useMemo(() => {
		// Stage Response exists without Stage Request (edge case)
		if (!hasAppEntry) {
			if (hasEnd) return "addStageRequest" as const;
			return null;
		}

		// Step 1: user placed Stage Request → prompt to configure
		if (!isRequestAcknowledged) return "setUpStageRequest" as const;

		// Step 2: after acknowledging Stage Request → prompt Stage Response
		if (!isResponseAcknowledged) return "setUpStageResponse" as const;

		// Step 3: hide
		return null;
	}, [hasAppEntry, hasEnd, isRequestAcknowledged, isResponseAcknowledged]);

	const handleClick = useCallback(() => {
		if (messageType === "setUpStageRequest") {
			setIsRequestAcknowledged(true);
			return;
		}
		if (messageType === "setUpStageResponse") {
			setIsResponseAcknowledged(true);
		}
	}, [messageType]);

	const message = useMemo(() => {
		if (messageType === "addStageRequest") return "Add Stage Request.";
		if (messageType === "setUpStageRequest") return "Set up Stage Request.";
		if (messageType === "setUpStageResponse") return "Set up Stage Response.";
		return null;
	}, [messageType]);

	if (!message) return null;

	return (
		<button
			type="button"
			onClick={handleClick}
			className="flex items-center gap-[8px] px-[12px] py-[8px] bg-warning/20 backdrop-blur-sm border border-warning text-inverse rounded-[8px] shadow-lg hover:bg-warning/30 transition-colors"
		>
			<InfoIcon className="size-[16px]" />
			<span className="text-[14px] font-medium">{message}</span>
		</button>
	);
}
