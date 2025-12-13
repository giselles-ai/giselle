"use client";

import { TaskHeader } from "@/components/task/task-header";
import { StepsSection } from "./steps-section";
import { TaskProvider, useTask } from "./task-context";
import type { UITask } from "./task-data";

export function TaskClient({
	initial,
	refreshAction,
}: {
	initial: UITask;
	refreshAction: () => Promise<UITask>;
}) {
	return (
		<TaskProvider initial={initial} refreshAction={refreshAction}>
			<TaskContainer />
		</TaskProvider>
	);
}

function TaskContainer() {
	const { data } = useTask();

	return (
		<>
			<TaskHeader
				status={data.status}
				title={data.title}
				description={data.description}
				workspaceId={data.workspaceId}
				input={data.input}
			/>
			<div className="flex-1 overflow-y-auto overflow-x-hidden pb-8">
				<StepsSection {...data.stepsSection} status={data.status} />
			</div>
		</>
	);
}
