import {
	isImageGenerationNode,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import {
	type ActId,
	defaultName,
	type Generation,
	type Step,
	type StepId,
} from "@giselle-sdk/giselle";
import { NodeIcon } from "@giselles-ai/icons/node";

import { notFound } from "next/navigation";
import { giselleEngine } from "@/app/giselle-engine";
import { GenerationView } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { StepLayout } from "./ui/step-layout";

// Helper function to get model info from generation
function getModelInfo(generation: Generation): {
	provider: string;
	modelName: string;
	iconName: string;
} {
	try {
		const operationNode = generation.context.operationNode;
		if (
			operationNode &&
			(isTextGenerationNode(operationNode) ||
				isImageGenerationNode(operationNode))
		) {
			const provider = operationNode.content.llm.provider;
			const modelName = operationNode.content.llm.id || provider;

			// Get appropriate icon name based on provider
			let iconName = "brain-circuit"; // default icon
			switch (provider) {
				case "openai":
					iconName = "sparkles";
					break;
				case "anthropic":
					iconName = "brain-circuit";
					break;
				case "google":
					iconName = "search";
					break;
				case "fal":
					iconName = "image";
					break;
			}

			return { provider, modelName, iconName };
		}
	} catch (_error) {
		// If we can't access the operation node, fall back to defaults
	}
	return {
		provider: "Unknown",
		modelName: "Unknown",
		iconName: "brain-circuit",
	};
}

export default async function ({
	params,
}: {
	params: Promise<{ actId: ActId; stepId: StepId }>;
}) {
	const { actId, stepId } = await params;

	const act = await giselleEngine.getAct({ actId });
	let step: Step | undefined;
	for (const sequence of act.sequences) {
		for (const tmp of sequence.steps) {
			if (tmp.id === stepId) {
				step = tmp;
				break;
			}
		}
		if (step !== undefined) {
			break;
		}
	}
	if (step === undefined) {
		return notFound();
	}
	const generation = await giselleEngine.getGeneration(step.generationId, true);
	if (generation === undefined) {
		return notFound();
	}

	const modelInfo = getModelInfo(generation);

	return (
		<>
			{/* Desktop Layout */}
			<div className="hidden md:block">
				<StepLayout
					generation={generation}
					header={
						<div className="flex items-center gap-[6px]">
							<div className="p-[8px] bg-element-active rounded-[4px]">
								<NodeIcon
									node={generation.context.operationNode}
									className="size-[16px]"
								/>
							</div>
							<div className="flex flex-col">
								<div className="text-[14px]">
									{generation.context.operationNode.name ??
										defaultName(generation.context.operationNode)}
								</div>
								<div className="text text-text-muted text-[10px] flex items-center gap-[4px]">
									<span>{modelInfo.modelName}</span>
									<div className="size-[2px] rounded-full bg-text-muted" />
									<span>Finished: 07/17/2025, 10:48 AM</span>
								</div>
							</div>
						</div>
					}
				>
					<GenerationView generation={generation} />
				</StepLayout>
			</div>
		</>
	);
}
