import { notFound } from "next/navigation";
import { stageFlag } from "@/flags";

/** ActId is a string with 'flrn-' removed from FlowRunId. */
type ActId = string;

// memo
// import type { FlowRunId } from "@giselle-sdk/giselle-engine";
// function actIdToFlowRunId(actId: ActId): FlowRunId {
// 	return `flrn-${actId}`;
// }

export default async function ({
	params,
}: {
	params: Promise<{ actId: ActId }>;
}) {
	const enableStage = await stageFlag();
	if (!enableStage) {
		return notFound();
	}
	const { actId } = await params;

	return null;
}
