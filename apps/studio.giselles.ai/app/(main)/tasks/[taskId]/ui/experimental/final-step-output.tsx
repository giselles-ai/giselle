import { Tabs } from "radix-ui";
import { GenerationView } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import type { UITask } from "./task-data";

export function FinalStepOutput({
	finalStep,
}: {
	finalStep: UITask["finalStep"];
}) {
	return (
		<div className="mt-8">
			<div className="flex items-center justify-between text-text-muted text-[13px] font-semibold mb-2 w-full">
				<span className="block">Output from last completed step</span>
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
			) : (
				<Tabs.Root>
					<Tabs.List>
						{finalStep.outputs.map((output) => (
							<Tabs.Trigger
								key={output.generation.id}
								value={output.generation.id}
							>
								{output.title}
							</Tabs.Trigger>
						))}
					</Tabs.List>

					{finalStep.outputs.map((output) => (
						<Tabs.Content
							key={output.generation.id}
							value={output.generation.id}
						>
							<GenerationView generation={output.generation} />
						</Tabs.Content>
					))}
				</Tabs.Root>
			)}
		</div>
	);
}
