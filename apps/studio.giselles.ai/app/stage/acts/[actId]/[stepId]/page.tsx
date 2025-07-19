import { experimental_storageFlag } from "@/flags";
import type { Step } from "../../object";
import { giselleEngine } from "@/app/giselle-engine";
import { notFound } from "next/navigation";
import { defaultName } from "@giselle-sdk/giselle-engine";

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

	// switch (generation.status) {
	// 	case "queued":
	// 		return <p>queued</p>;
	// 	case "created":
	// 		return <p>created</p>;
	// 	case "running":
	// 		return <p>running</p>;
	// 	case "completed":
	// 		return <p>completed</p>;
	// 	case "failed":
	// 		return <p>failed</p>;
	//    case 'cancelled':
	//      return <p>cancelled</p>;
	// 	default: {
	// 		const _exhaustiveCheck: never = generation;
	// 		throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
	// 	}
	// }

  return <div>{defaultName(generation.context.operationNode)}</div>;
}
