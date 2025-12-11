"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";

interface StepErrorStateProps {
	workspaceId: string;
	stepId: string;
	onRerun?: () => void;
}

export function StepErrorState({
	workspaceId,
	stepId: _stepId,
	onRerun,
}: StepErrorStateProps) {
	return (
		<div className="ml-4 pl-4 border-l-2 border-border mt-2 mb-2">
			<div className="rounded-lg border border-border bg-surface/30 px-4 py-3">
				<p className="text-[13px] text-text-muted leading-relaxed">
					This step failed during the last run.
					<br />
					Individual step execution is not available on this page.
					<br />
					To review or debug this step, open it in Studio.
				</p>
				<div className="flex items-center gap-2 mt-3">
					<Link
						href={`/workspaces/${workspaceId}`}
						target="_blank"
						rel="noreferrer"
						className="text-[13px] text-[hsl(192,73%,84%)] hover:text-[hsl(192,73%,70%)] transition-colors font-medium"
					>
						Open Step in Studio →
					</Link>
					{onRerun && (
						<button
							type="button"
							onClick={onRerun}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-border text-[13px] text-text-muted hover:bg-white/10 hover:text-text transition-colors"
						>
							<RefreshCw className="size-3.5" />
							Run full flow again
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
