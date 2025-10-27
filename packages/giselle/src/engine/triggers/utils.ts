import { FlowTrigger, type FlowTriggerId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "../experimental_storage";
import { removeGitHubRepositoryIntegrationIndex } from "../integrations/utils";

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
	deprecated_storage,
	storage,
	flowTriggerId,
	useExperimentalStorage = false,
}: {
	deprecated_storage: Storage;
	flowTriggerId: FlowTriggerId;
	storage: GiselleStorage;
	useExperimentalStorage?: boolean;
}) {
	const trigger = await getFlowTrigger({
		deprecated_storage: deprecated_storage,
		storage: storage,
		flowTriggerId,
		useExperimentalStorage,
	});
	if (trigger === undefined) {
		throw new Error(`Flow trigger with ID ${flowTriggerId} not found`);
	}
	const path = flowTriggerPath({ flowTriggerId });
	if (useExperimentalStorage) {
		await storage.remove(path);
	} else {
		await deprecated_storage.removeItem(path);
	}
	if (trigger.configuration.provider === "github") {
		await removeGitHubRepositoryIntegrationIndex({
			deprecated_storage: deprecated_storage,
			storage: storage,
			flowTriggerId,
			repositoryNodeId: trigger.configuration.repositoryNodeId,
			useExperimentalStorage,
		});
	}
}
