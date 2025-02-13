import { useCallback } from "react";
import type { WorkflowData } from "../workflow-data";
import { callCreateWorkflowApi } from "./call-create-workflow-api";

export function useCreateWorkflow({
	onWorkflowCreated,
}: {
	onWorkflowCreated?: ({
		workflowData,
	}: { workflowData: WorkflowData }) => void;
} = {}) {
	const createWorkflow = useCallback(async () => {
		const { workflowData } = await callCreateWorkflowApi();
		onWorkflowCreated?.({ workflowData });
	}, [onWorkflowCreated]);
	return {
		createWorkflow,
	};
}
