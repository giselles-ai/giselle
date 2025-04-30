import {
	type CreatedRun,
	type FileId,
	type OverrideNode,
	type QueuedRun,
	type WorkflowId,
	type WorkspaceId,
	isFileNode,
} from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { filePath } from "../files/utils";
import type { GiselleEngineContext } from "../types";
import { getWorkflow, overrideGenerationTemplate, setRun } from "./utils";

export async function addRun(args: {
	workspaceId: WorkspaceId;
	workflowId: WorkflowId;
	run: CreatedRun;
	overrideNodes: OverrideNode[];
	context: GiselleEngineContext;
}) {
	const workflow = await getWorkflow({
		storage: args.context.storage,
		workspaceId: args.workspaceId,
		workflowId: args.workflowId,
	});

	const overrideWorkflow = {
		...workflow,
		jobs: workflow.jobs.map((job) => ({
			...job,
			operations: job.operations.map((operation) => ({
				...operation,
				generationTemplate: overrideGenerationTemplate(
					operation.generationTemplate,
					args.overrideNodes ?? [],
				),
			})),
		})),
	};

	/** @todo upload openai file to vector store */
	const queuedRun = {
		...args.run,
		status: "queued",
		workspaceId: args.workspaceId,
		workflow: overrideWorkflow,
		overrideNodes: args.overrideNodes,
		queuedAt: Date.now(),
	} satisfies QueuedRun;
	await Promise.all([
		setRun({ run: queuedRun, storage: args.context.storage }),
		copyFiles({
			storage: args.context.storage,
			queuedRun,
		}),
	]);
	return queuedRun;
}

async function copyFiles({
	storage,
	queuedRun,
}: { storage: Storage; queuedRun: QueuedRun }) {
	const fileIds: FileId[] = [];
	for (const node of queuedRun.workflow.nodes) {
		if (!isFileNode(node)) {
			continue;
		}
		for (const file of node.content.files) {
			if (file.status !== "uploaded") {
				continue;
			}
			fileIds.push(file.id);
		}
	}
	await Promise.all(
		fileIds.map(async (fileId) => {
			const workspaceFilePath = filePath({
				fileId,
				type: "workspace",
				id: queuedRun.workspaceId,
			});
			const fileContent = await storage.getItemRaw(workspaceFilePath);
			const runFilePath = filePath({
				fileId,
				type: "run",
				id: queuedRun.id,
			});
			await storage.setItemRaw(runFilePath, fileContent);
		}),
	);
}
