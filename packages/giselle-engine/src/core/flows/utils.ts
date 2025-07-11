import { FlowTrigger, type FlowTriggerId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { removeGitHubRepositoryIntegrationIndex } from "../integrations/utils";

function flowTriggerPath(params: { flowTriggerId: FlowTriggerId }) {
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
	if (unsafe === null) {
		return undefined;
	}

	return FlowTrigger.parse(unsafe);
}

export async function deleteFlowTrigger({
	storage,
	flowTriggerId,
}: {
	storage: Storage;
	flowTriggerId: FlowTriggerId;
}) {
	const trigger = await getFlowTrigger({ storage, flowTriggerId });
	if (trigger === undefined) {
		throw new Error(`Flow trigger with ID ${flowTriggerId} not found`);
	}
	await storage.removeItem(flowTriggerPath({ flowTriggerId }));
	if (trigger.configuration.provider === "github") {
		await removeGitHubRepositoryIntegrationIndex({
			storage,
			flowTriggerId,
			repositoryNodeId: trigger.configuration.repositoryNodeId,
		});
	}
}
