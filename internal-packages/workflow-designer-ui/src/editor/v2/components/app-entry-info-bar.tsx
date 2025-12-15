"use client";

import { useWorkflowDesignerStore } from "@giselles-ai/react";
import { InfoIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";

export function AppEntryInfoBar() {
	const [isRequestAcknowledged, setIsRequestAcknowledged] = useState(false);
	const [isResponseAcknowledged, setIsResponseAcknowledged] = useState(false);

	const { hasAppEntry, hasEnd } = useWorkflowDesignerStore(
		useShallow((s) => {
			const nodes = s.workspace.nodes;
			return {
				hasAppEntry: nodes.some((n) => n.content.type === "appEntry"),
				hasEnd: nodes.some((n) => n.content.type === "end"),
			};
		}),
	);

	useEffect(() => {
		if (!hasAppEntry) {
			setIsRequestAcknowledged(false);
		}
	}, [hasAppEntry]);

	useEffect(() => {
		if (!hasEnd) {
			setIsResponseAcknowledged(false);
		}
	}, [hasEnd]);

	const handleClick = useCallback(() => {
		if (!hasAppEntry && hasEnd) {
			// "Add Stage Request."
			return;
		}
		if (hasAppEntry && !hasEnd) {
			// "Set up Stage Request." -> "Add Stage Response."
			setIsRequestAcknowledged(true);
			return;
		}
		if (hasAppEntry && hasEnd) {
			// "Set up Stage Response." -> hide
			setIsResponseAcknowledged(true);
		}
	}, [hasAppEntry, hasEnd]);

	const message = useMemo(() => {
		// Stage Response only
		if (!hasAppEntry) {
			if (hasEnd) return "Add Stage Request.";
			return null;
		}

		// Stage Request exists, Stage Response missing
		if (!hasEnd) {
			if (!isRequestAcknowledged) return "Set up Stage Request.";
			return "Add Stage Response.";
		}

		// Both exist: prompt to configure Stage Response until user acknowledges
		if (!isResponseAcknowledged) return "Set up Stage Response.";
		return null;
	}, [hasAppEntry, hasEnd, isRequestAcknowledged, isResponseAcknowledged]);

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
