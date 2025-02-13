"use client";

import { useCreateWorkflow } from "@/lib/workflow-designer";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();

	const { createWorkflow } = useCreateWorkflow({
		onWorkflowCreated: ({ workflowData }) => {
			router.push(`/workflows/${workflowData.id}`);
		},
	});
	return (
		<button type="button" onClick={createWorkflow}>
			Create workflow
		</button>
	);
}
