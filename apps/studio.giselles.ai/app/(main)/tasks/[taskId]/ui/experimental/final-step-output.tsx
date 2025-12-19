"use client";

import clsx from "clsx/lite";
import { ChevronRight } from "lucide-react";
import { GenerationView } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { OutputActions } from "../output-actions";
import { useOutputDetailPaneStore } from "./output-detail-pane-store";
import type { UITask } from "./task-data";

export function FinalStepOutput({
	finalStep,
}: {
	finalStep: UITask["finalStep"];
}) {
	const outputs = finalStep.outputs;
	const outputCount = outputs.length;
	const singleOutput = outputCount === 1 ? outputs[0] : undefined;
	const opened = useOutputDetailPaneStore((s) => s.opened);
	const open = useOutputDetailPaneStore((s) => s.open);

	return (
		<div className="mt-8">
			<div className="flex items-center justify-between text-text-muted text-[13px] font-semibold mb-2 w-full">
				<span className="block">
					{outputCount > 1
						? `Outputs from last completed step (${outputCount})`
						: "Output from last completed step"}
				</span>
			</div>
			{finalStep.finishedStepItemsCount === 0 ? (
				<p className="text-[13px] text-text-muted/70 italic">
					<span
						className="bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-text-muted/70 via-text-muted/35 to-text-muted/70 text-transparent animate-shimmer"
						style={{
							animationDuration: "1s",
							animationTimingFunction: "linear",
						}}
					>
						Please wait, executing...
					</span>
				</p>
			) : singleOutput ? (
				<div className="overflow-hidden rounded-xl bg-blue-muted/5 px-4 py-3">
					<div className="flex items-center justify-between mb-2 w-full gap-3">
						<h3 className="text-[14px] font-medium text-inverse truncate">
							{singleOutput.title}
						</h3>
						<OutputActions generation={singleOutput.generation} />
					</div>
					<div className="[&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
						<GenerationView generation={singleOutput.generation} />
					</div>
				</div>
			) : (
				<div className="space-y-2">
					{outputs.map((output) => {
						const isOpened = opened?.id === output.id;
						return (
							<button
								key={output.id}
								type="button"
								onClick={() =>
									open({
										id: output.id,
										title: output.title,
										generation: output.generation,
									})
								}
								className={clsx(
									"w-full text-left rounded-xl border px-3 py-2 transition-colors",
									"bg-blue-muted/5 hover:bg-blue-muted/10",
									isOpened
										? "border-[hsl(192,73%,84%)]/30 bg-blue-muted/10"
										: "border-border",
								)}
							>
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0">
										<div
											className={clsx(
												"text-[14px] font-medium truncate",
												isOpened ? "text-inverse" : "text-text-muted",
											)}
										>
											{output.title}
										</div>
										<div className="text-[11px] text-text-muted/70 mt-0.5">
											{output.type}
										</div>
									</div>
									<div
										className={clsx(
											"shrink-0 transition-colors",
											isOpened
												? "text-[hsl(192,73%,84%)]"
												: "text-text-muted/70",
										)}
										aria-hidden
									>
										<ChevronRight className="h-4 w-4" />
									</div>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
