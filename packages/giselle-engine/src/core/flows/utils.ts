import { FlowTrigger, type FlowTriggerId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";

export function flowTriggerPath(params: { flowTriggerId: FlowTriggerId }) {
	return `flow-triggers/${params.flowTriggerId}.json`;
}

export async function setFlowTrigger({
	storage,
	flowTrigger,
}: {
	storage: Storage;
	flowTrigger: FlowTrigger;
}) {
	await storage.set(
		flowTriggerPath({ flowTriggerId: flowTrigger.id }),
		flowTrigger,
	);
}

export async function getFlowTrigger({
	storage,
	flowTriggerId,
}: {
	storage: Storage;
	flowTriggerId: FlowTriggerId;
}) {
	const unsafe = await storage.get(
		flowTriggerPath({
			flowTriggerId: flowTriggerId,
		}),
		{
			bypassingCache: true,
		},
	);

	return FlowTrigger.parse(unsafe);
}
