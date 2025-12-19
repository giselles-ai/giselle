"use client";

import clsx from "clsx/lite";
import { useEffect, useState } from "react";
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

	useEffect(() => {
		// Keep selection stable when outputs list updates (e.g. polling),
		// but fall back to the first output if the previous selection is gone.
		if (outputs.length === 0) {
			setSelectedOutputId(null);
			return;
		}
		if (selectedOutputId == null) {
			setSelectedOutputId(outputs[0].id);
			return;
		}
		const stillExists = outputs.some((o) => o.id === selectedOutputId);
		if (!stillExists) {
			setSelectedOutputId(outputs[0].id);
		}
	}, [outputs, selectedOutputId]);

	const OutputGenerationPanel = ({
		title,
		generation,
	}: {
		title: string;
		generation: (typeof outputs)[number]["generation"];
	}) => {
		return (
			<>
				<div className="flex items-center justify-between mb-2 w-full gap-3">
					<h3 className="text-[14px] font-medium text-inverse truncate">
						{title}
					</h3>
					<OutputActions generation={generation} />
				</div>
				<div className="[&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
					<GenerationView generation={generation} />
				</div>
			</>
		);
	};

	const selectedOutput =
		selectedOutputId == null
			? undefined
			: outputs.find((o) => o.id === selectedOutputId);

	return (
		<div className="mt-8">
			<div className="flex items-center justify-between text-text-muted text-[13px] font-semibold mb-2 w-full">
				<span className="block">
					{outputCount > 1 ? `Outputs (${outputCount})` : "Output"}
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
					<OutputGenerationPanel
						title={singleOutput.title}
						generation={singleOutput.generation}
					/>
				</div>
			) : (
				<div className="grid grid-cols-[220px_1fr] gap-3 items-start">
					{/* Output list (artifacts) */}
					<div className="space-y-2">
						{outputs.map((output) => {
							const isSelected = output.id === selectedOutputId;
							return (
								<button
									key={output.id}
									type="button"
									onClick={() => setSelectedOutputId(output.id)}
									className={clsx(
										"w-full text-left rounded-xl border px-3 py-2 transition-colors",
										"bg-blue-muted/5 hover:bg-blue-muted/10",
										isSelected
											? "border-[hsl(192,73%,84%)]/30 bg-blue-muted/10"
											: "border-border",
									)}
								>
									<div className="flex items-center justify-between gap-2">
										<span
											className={clsx(
												"text-[13px] font-medium truncate",
												isSelected ? "text-inverse" : "text-text-muted",
											)}
										>
											{output.title}
										</span>
										<span className="text-[11px] text-text-muted/70 shrink-0">
											{output.type}
										</span>
									</div>
									{output.preview ? (
										<p className="mt-1 text-[12px] text-text-muted/70 line-clamp-2">
											{output.preview}
										</p>
									) : (
										<p className="mt-1 text-[12px] text-text-muted/50 italic">
											No preview
										</p>
									)}
									<div className="mt-2">
										<span className="text-[12px] text-[hsl(192,73%,84%)] hover:text-[hsl(192,73%,70%)] transition-colors font-medium">
											Open →
										</span>
									</div>
								</button>
							);
						})}
					</div>

					{/* Detail view */}
					<div className="overflow-hidden rounded-xl bg-blue-muted/5 px-4 py-3 min-w-0">
						{selectedOutput ? (
							<OutputGenerationPanel
								title={selectedOutput.title}
								generation={selectedOutput.generation}
							/>
						) : (
							<p className="text-[13px] text-text-muted/70 italic">
								Select an output to view details.
							</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
