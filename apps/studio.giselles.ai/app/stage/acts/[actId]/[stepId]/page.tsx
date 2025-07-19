import { NodeIcon } from "@giselles-ai/icons/node";
import { notFound } from "next/navigation";
import { giselleEngine } from "@/app/giselle-engine";
import { experimental_storageFlag } from "@/flags";
import { GenerationView } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import type { Step } from "../../object";

async function fetchStep(_actId: string, _stepId: string) {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	return {
		id: "step-1-1",
		text: "Generate Query",
		status: "success",
		generationId: "gnr-Q7IQPMn4dSpzfDVS",
	} satisfies Step;
}

export default async function ({
	params,
}: {
	params: Promise<{ actId: string; stepId: string }>;
}) {
	const { actId, stepId } = await params;
	const step = await fetchStep(actId, stepId);
	const useExperimentalStorage = await experimental_storageFlag();
	const generation = await giselleEngine.getGeneration(
		step.generationId,
		useExperimentalStorage,
	);
	if (generation === undefined) {
		return notFound();
	}

	return (
		<div className="flex flex-col w-full">
			<header className="bg-tab-active-background p-[16px] flex items-center">
				<div className="flex items-center gap-[6px]">
					<div className="p-[8px] bg-element-active rounded-[4px]">
						<NodeIcon
							node={generation.context.operationNode}
							className="size-[16px]"
						/>
					</div>
					<div className="flex flex-col">
						<div className="text-[14px]">Generate Query</div>
						<div className="text text-text-muted text-[10px] flex items-center gap-[4px]">
							<span>gpt-4o</span>
							<div className="size-[2px] rounded-full bg-text-muted" />
							<span>Finished: 07/17/2025, 10:48 AM</span>
						</div>
					</div>
				</div>
			</header>
			<main className="p-[16px] overflow-y-auto">
				<div className="max-w-[600px] mx-auto">
					<GenerationView generation={generation} />
				</div>
			</main>
		</div>
	);
}
