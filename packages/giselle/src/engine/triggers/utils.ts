import { FlowTrigger, type FlowTriggerId } from "@giselle-ai/protocol";
import { removeGitHubRepositoryIntegrationIndex } from "../integrations/utils";
import type { GiselleStorage } from "../storage";

function flowTriggerPath(params: { flowTriggerId: FlowTriggerId }) {
	return `flow-triggers/${params.flowTriggerId}.json`;
}

export async function setFlowTrigger({
	storage,
	flowTrigger,
}: {
	storage: GiselleStorage;
	flowTrigger: FlowTrigger;
}) {
	const path = flowTriggerPath({ flowTriggerId: flowTrigger.id });
	await storage.setJson({
		path,
		data: flowTrigger,
		schema: FlowTrigger,
	});
	return;
}

export async function getFlowTrigger({
	storage,
	flowTriggerId,
}: {
	flowTriggerId: FlowTriggerId;
	storage: GiselleStorage;
}) {
	const path = flowTriggerPath({
		flowTriggerId,
	});
	const exists = await storage.exists(path);
	if (!exists) {
		return undefined;
	}
	return await storage.getJson({
		path,
		schema: FlowTrigger,
	});
}

export async function deleteFlowTrigger({
	storage,
	flowTriggerId,
}: {
	flowTriggerId: FlowTriggerId;
	storage: GiselleStorage;
}) {
	const trigger = await getFlowTrigger({
		storage: storage,
		flowTriggerId,
	});
	if (trigger === undefined) {
		throw new Error(`Flow trigger with ID ${flowTriggerId} not found`);
	}
	const path = flowTriggerPath({ flowTriggerId });
	await storage.remove(path);
	if (trigger.configuration.provider === "github") {
		await removeGitHubRepositoryIntegrationIndex({
			storage: storage,
			flowTriggerId,
			repositoryNodeId: trigger.configuration.repositoryNodeId,
		});
	}
}
