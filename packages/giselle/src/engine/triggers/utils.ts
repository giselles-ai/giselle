import { FlowTrigger, type FlowTriggerId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "../experimental_storage";
import { removeGitHubRepositoryIntegrationIndex } from "../integrations/utils";

function flowTriggerPath(params: { flowTriggerId: FlowTriggerId }) {
	return `flow-triggers/${params.flowTriggerId}.json`;
}

export async function setFlowTrigger({
	deprecated_storage,
	storage,
	flowTrigger,
	useExperimentalStorage = false,
}: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	flowTrigger: FlowTrigger;
	useExperimentalStorage?: boolean;
}) {
	const path = flowTriggerPath({ flowTriggerId: flowTrigger.id });
	if (useExperimentalStorage) {
		await storage.setJson({
			path,
			data: flowTrigger,
			schema: FlowTrigger,
		});
		return;
	}
	await deprecated_storage.set(path, flowTrigger);
}

export async function getFlowTrigger({
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
	const path = flowTriggerPath({
		flowTriggerId,
	});
	if (useExperimentalStorage) {
		const exists = await storage.exists(path);
		if (!exists) {
			return undefined;
		}
		return await storage.getJson({
			path,
			schema: FlowTrigger,
		});
	}
	const unsafe = await deprecated_storage.get(path, {
		bypassingCache: true,
	});
	if (unsafe === null) {
		return undefined;
	}

	return FlowTrigger.parse(unsafe);
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
