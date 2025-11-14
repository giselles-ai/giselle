import { Trigger, type TriggerId } from "@giselles-ai/protocol";
import { removeGitHubRepositoryIntegrationIndex } from "../integrations/utils";
import type { GiselleStorage } from "../storage";

function triggerPath(params: { triggerId: TriggerId }) {
	return `flow-triggers/${params.triggerId}.json`;
}

export async function setTrigger({
	storage,
	trigger,
}: {
	storage: GiselleStorage;
	trigger: Trigger;
}) {
	const path = triggerPath({ triggerId: trigger.id });
	await storage.setJson({
		path,
		data: trigger,
		schema: Trigger,
	});
	return;
}

export async function getTrigger({
	storage,
	triggerId,
}: {
	triggerId: TriggerId;
	storage: GiselleStorage;
}) {
	const path = triggerPath({
		triggerId: triggerId,
	});
	const exists = await storage.exists(path);
	if (!exists) {
		return undefined;
	}
	return await storage.getJson({
		path,
		schema: Trigger,
	});
}

export async function deleteTrigger({
	storage,
	triggerId: flowTriggerId,
}: {
	triggerId: TriggerId;
	storage: GiselleStorage;
}) {
	const trigger = await getTrigger({
		storage: storage,
		triggerId: flowTriggerId,
	});
	if (trigger === undefined) {
		throw new Error(`Flow trigger with ID ${flowTriggerId} not found`);
	}
	const path = triggerPath({ triggerId: flowTriggerId });
	await storage.remove(path);
	if (trigger.configuration.provider === "github") {
		await removeGitHubRepositoryIntegrationIndex({
			storage: storage,
			triggerId: flowTriggerId,
			repositoryNodeId: trigger.configuration.repositoryNodeId,
		});
	}
}
