import { WorkflowDataJson, workflowId } from "@/lib/workflow-data";
import type { StorageMeta } from "unstorage";
import { z } from "zod";
import { setGraphToStorage } from "../helpers/set-graph-to-storage";
import type { WorkflowEngineHandlerArgs } from "./types";

export const Input = z.object({
	workflowId: workflowId.schema,
	workflowData: WorkflowDataJson,
});
export const Output = z.object({
	workflowData: WorkflowDataJson,
	meta: z.custom<StorageMeta>(),
});
export async function saveWorkflow({
	context,
	unsafeInput,
}: WorkflowEngineHandlerArgs<z.infer<typeof Input>>) {
	const input = Input.parse(unsafeInput);
	setGraphToStorage({
		storage: context.storage,
		workflowId: input.workflowId,
		workflowData: input.workflowData,
	});
	const meta = await context.storage.getMeta(`${input.workflowId}.json`);
	return Output.parse({
		workflowData: input.workflowData,
		meta,
	});
}
