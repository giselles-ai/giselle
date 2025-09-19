import type { Generation } from "@giselle-sdk/giselle";
import { StepLayout } from "./[stepId]/ui/step-layout";

// Define a dummy generation object for the loading state to satisfy StepLayout's props
const dummyGeneration: Generation = {
	id: "gnr-YZHtVOATbNRxxxxx",
	context: {
		operationNode: {
			id: "nd-TgsASBm3TvVxxxxx",
			name: "Claude 4 Sonnet with Reasoning",
			type: "operation",
			inputs: [],
			outputs: [
				{
					id: "otp-bSeZklOS4SeDOxOC",
					label: "Output",
					accessor: "generated-text",
				},
			],
			content: {
				type: "textGeneration",
				llm: {
					provider: "anthropic",
					id: "claude-4-sonnet-20250514",
					configurations: {
						temperature: 0.7,
						topP: 1,
						reasoningText: false,
					},
				},
				prompt: "hello",
			},
		},
		sourceNodes: [],
		connections: [],
		origin: {
			actId: "act-Ibp7hXQp2TWPUEUo",
			workspaceId: "wrks-bQi1pOHmSRtH8Qo6",
			type: "studio",
		},
		inputs: [],
	},
	status: "completed",
	createdAt: 1755586531409,
	queuedAt: 1755586535244,
	startedAt: 1755586535398,
	completedAt: 1755586544713,
	messages: [
		{
			id: "",
			role: "assistant",
			parts: [
				{ type: "step-start" },
				{
					type: "text",
					text: "I need to find N where 100 ≤ N ≤ 250 that satisfies all three conditions.\n\nFirst, let me unde...",
					state: "done",
				},
			],
		},
	],
	outputs: [
		{
			type: "generated-text",
			outputId: "otp-bSeZklOS4SeDOxOC",
			content:
				"I need to find N where 100 ≤ N ≤ 250 that satisfies all three conditions.\n\nFirst, let me understand condition (c): N...",
		},
	],

	usage: {
		inputTokens: 137,
		outputTokens: 654,
		totalTokens: 791,
		cachedInputTokens: 0,
	},
};

export default function Loading() {
	return (
		<StepLayout
			generation={dummyGeneration}
			header={
				<div className="flex items-center gap-[6px]">
					<div className="p-[8px] bg-element-active rounded-[4px]">
						<div className="size-[16px] bg-gray-600 rounded animate-pulse" />
					</div>
					<div className="flex flex-col gap-[4px]">
						<div className="w-32 h-[14px] bg-gray-600 rounded animate-pulse" />
						<div className="flex items-center gap-[4px]">
							<div className="w-12 h-[10px] bg-gray-600 rounded animate-pulse" />
							<div className="size-[2px] rounded-full bg-gray-600 animate-pulse" />
							<div className="w-24 h-[10px] bg-gray-600 rounded animate-pulse" />
						</div>
					</div>
				</div>
			}
		>
			{/* Skeleton for GenerationView content */}
			<div className="space-y-[16px]">
				{/* Main content blocks */}
				<div className="space-y-[8px]">
					<div className="w-full h-[20px] bg-gray-600 rounded animate-pulse" />
					<div className="w-full h-[20px] bg-gray-600 rounded animate-pulse" />
					<div className="w-4/5 h-[20px] bg-gray-600 rounded animate-pulse" />
				</div>

				{/* Accordion-style skeleton for reasoning sections */}
				<div className="space-y-[8px]">
					<div className="flex items-center gap-[4px]">
						<div className="w-full h-[20px] bg-gray-600 rounded animate-pulse" />
						<div className="w-4/5 h-[20px] bg-gray-600 rounded animate-pulse" />
					</div>
					<div className="ml-[20px] pl-[12px] border-l border-l-gray-600/20 space-y-[4px]">
						<div className="w-full h-[14px] bg-gray-600 rounded animate-pulse" />
						<div className="w-3/4 h-[14px] bg-gray-600 rounded animate-pulse" />
						<div className="w-20 h-[12px] bg-gray-600 rounded animate-pulse" />
					</div>
				</div>

				{/* More content blocks */}
				<div className="space-y-[8px]">
					<div className="w-3/4 h-[14px] bg-gray-600 rounded animate-pulse" />
					<div className="w-3/4 h-[20px] bg-gray-600 rounded animate-pulse" />
				</div>
			</div>
		</StepLayout>
	);
}
