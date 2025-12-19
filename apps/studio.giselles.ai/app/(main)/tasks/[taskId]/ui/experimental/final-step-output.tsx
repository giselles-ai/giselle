"use client";

import clsx from "clsx/lite";
import { useState } from "react";
import { GenerationView } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { OutputActions } from "../output-actions";
import type { UITask } from "./task-data";

export function FinalStepOutput({
	finalStep,
}: {
	finalStep: UITask["finalStep"];
}) {
	const outputs = finalStep.outputs;
	const outputCount = outputs.length;
	const singleOutput = outputCount === 1 ? outputs[0] : undefined;
	const [selectedOutputId, setSelectedOutputId] = useState<string | null>(
		outputs.at(0)?.id ?? null,
	);
	const selectedOutput =
		outputs.find((o) => o.id === selectedOutputId) ?? outputs.at(0) ?? null;

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
				<div className="overflow-hidden rounded-t-xl rounded-b-none bg-blue-muted/5 px-4 py-3">
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
				<div>
					<div className="inline-flex items-center gap-0 rounded-t-xl rounded-b-none max-w-full overflow-x-auto pl-4">
						{outputs.map((output) => {
							const isSelected = selectedOutput?.id === output.id;
							return (
								<button
									key={output.id}
									type="button"
									onClick={() => setSelectedOutputId(output.id)}
									className={clsx(
										"rounded-t-lg rounded-b-none px-2.5 py-1.5 text-[13px] font-medium transition-colors whitespace-nowrap",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(192,73%,84%)]/30",
										isSelected
											? "bg-blue-muted/10 text-text-muted"
											: "text-text-muted/70 hover:text-text-muted",
									)}
								>
									{output.title}
								</button>
							);
						})}
					</div>

					{selectedOutput ? (
						<div className="overflow-hidden rounded-xl bg-blue-muted/10 px-4 py-3">
							<div className="flex items-center justify-between mb-2 w-full gap-3">
								<h3 className="text-[14px] font-medium text-inverse truncate">
									{selectedOutput.title}
								</h3>
								<OutputActions generation={selectedOutput.generation} />
							</div>
							<div className="[&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
								<GenerationView generation={selectedOutput.generation} />
							</div>
						</div>
					) : null}
				</div>
			)}
		</div>
	);
}
