"use client";

import { Tabs } from "radix-ui";
import { GenerationView } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { OutputActions } from "../output-actions";
import type { UITask } from "./task-data";

export function FinalStepOutput({
	finalStep,
}: {
	finalStep: UITask["finalStep"];
}) {
	const isAllFinalStepItemsFinished =
		finalStep.totalStepItemsCount > 0 &&
		finalStep.finishedStepItemsCount === finalStep.totalStepItemsCount;

	const outputs = finalStep.outputs;
	if (!isAllFinalStepItemsFinished || outputs.length === 0) {
		return null;
	}

	const defaultTabValue = outputs.at(0)?.generation.id;

	const OutputGenerationPanel = ({
		generation,
	}: {
		generation: (typeof outputs)[number]["generation"];
	}) => {
		return (
			<>
				<div className="[&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
					<GenerationView generation={generation} renderPartTypes={["text"]} />
				</div>
				<div className="flex items-center justify-between mb-2 w-full">
					<div className="flex-1" />
					<OutputActions generation={generation} />
				</div>
			</>
		);
	};

	return (
		<div className="mt-8">
			<Tabs.Root defaultValue={defaultTabValue}>
				<Tabs.List className="inline-flex items-center gap-1 rounded-xl bg-blue-muted/5 p-1">
					{outputs.map((output) => (
						<Tabs.Trigger
							key={output.generation.id}
							value={output.generation.id}
							className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-text-muted/70 transition-colors hover:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(192,73%,84%)]/30 data-[state=active]:bg-blue-muted/10 data-[state=active]:text-text-muted"
						>
							{output.title}
						</Tabs.Trigger>
					))}
				</Tabs.List>

				{outputs.map((output) => (
					<Tabs.Content
						key={output.generation.id}
						value={output.generation.id}
						className="mt-3 overflow-hidden rounded-xl bg-blue-muted/5 px-4 py-3"
					>
						<OutputGenerationPanel generation={output.generation} />
					</Tabs.Content>
				))}
			</Tabs.Root>
		</div>
	);
}
