"use client";

import { Tooltip } from "@giselle-internal/workflow-designer-ui";
import { Lock } from "lucide-react";

export function RunInStudioOnlyChip() {
	return (
		<Tooltip
			text="This step can't be run individually here. Open in Studio to debug."
			side="top"
			align="end"
			variant="dark"
			delayDuration={200}
		>
			<div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-border text-[11px] text-text-muted/70 cursor-default">
				<Lock className="size-3" />
				<span>Run in Studio only</span>
			</div>
		</Tooltip>
	);
}
