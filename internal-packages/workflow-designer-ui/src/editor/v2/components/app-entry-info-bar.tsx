"use client";

import { useWorkflowDesignerStore } from "@giselles-ai/react";
import { InfoIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";

export function AppEntryInfoBar() {
	const [isEntryConfigured, setIsEntryConfigured] = useState(false);

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
		if (hasAppEntry) {
			setIsEntryConfigured(false);
		}
	}, [hasAppEntry]);

	const handleClick = useCallback(() => {
		setIsEntryConfigured(true);
	}, []);

	const message = useMemo(() => {
		if (!hasAppEntry) return null;
		if (!isEntryConfigured) return "Set up Stage Request.";
		if (!hasEnd) return "Add Stage Response.";
		return null;
	}, [hasAppEntry, isEntryConfigured, hasEnd]);

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
