import { useContext } from "react";
import { WorkflowDesignerContext } from "../context";
import { type AppStore, useAppStore } from "./store";

export function useWorkflowDesigner() {
	const context = useContext(WorkflowDesignerContext);
	if (context === undefined) {
		throw new Error(
			"useWorkflowDesigner must be used within a WorkflowDesignerProvider",
		);
	}
	return context;
}

// Safe workspace selector with optional fallback
type WorkflowDesignerStore = Omit<AppStore, "workspace"> & {
	workspace: NonNullable<AppStore["workspace"]>;
};
export function useWorkflowDesignerStore<T>(
	selector: (workflowDesignerStore: WorkflowDesignerStore) => T,
) {
	return useAppStore((appStore) => {
		if (!appStore.workspace) {
			throw new Error("Workspace is not initialized");
		}
		return selector(appStore as WorkflowDesignerStore);
	});
}
