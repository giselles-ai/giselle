import {
	type CreatedRun,
	type QueuedRun,
	type RunId,
	type WorkflowId,
	type WorkspaceId,
	generateInitialWorkspace,
} from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleEngineContext } from "../types";
import { getWorkspace } from "../workspaces/utils";
import { setRun } from "./utils";

export async function addRun(args: {
	workspaceId: WorkspaceId;
	workflowId: WorkflowId;
	run: CreatedRun;
	context: GiselleEngineContext;
}) {
	const workspace = await getWorkspace({
		storage: args.context.storage,
		workspaceId: args.workspaceId,
	});

	if (workspace === undefined) {
		throw new Error("Workspace not found");
	}
	const workflow = workspace.editingWorkflows.find(
		(editingWorkflow) => editingWorkflow.id === args.workflowId,
	);
	if (workflow === undefined) {
		throw new Error("Workflow not found");
	}

	const runWorkspace = generateInitialWorkspace();
	/** @todo upload openai file to vector store */
	const queuedRun = {
		...args.run,
		status: "queued",
		workspaceId: runWorkspace.id,
		workflow,
		queuedAt: Date.now(),
	} satisfies QueuedRun;
	await Promise.all([
		setRun({ run: queuedRun, storage: args.context.storage }),
		copyFiles({
			storage: args.context.storage,
			workspaceId: args.workspaceId,
			runId: queuedRun.id,
		}),
	]);
	return queuedRun;
}

async function copyFiles({
	storage,
	workspaceId,
	runId,
}: { storage: Storage; workspaceId: WorkspaceId; runId: RunId }) {
	const fileKeys = await storage.getKeys(`workspaces/${workspaceId}/files`);

	await Promise.all(
		fileKeys.map(async (fileKey) => {
			const file = await storage.getItemRaw(fileKey);
			await storage.setItemRaw(
				fileKey.replace(/workspaces:wrks-\w+:files:/, `runs:${runId}:files:`),
				file,
			);
		}),
	);
}
