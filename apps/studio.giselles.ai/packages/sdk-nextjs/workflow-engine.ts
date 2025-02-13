import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import type { WorkflowDataJson } from "./lib/workflow-data";
import { NextWorkflowEngine } from "./lib/workflow-engine/next";

const storage = createStorage<WorkflowDataJson>({
	// driver: vercelBlobDriver({
	// 	access: "public",
	// 	base: "workflow-data",
	// }),
	driver: fsDriver({
		base: "./.storage/workflow-data",
	}),
});

export const workflowEngine = NextWorkflowEngine({
	basePath: "/api/workflow",
	storage,
});
