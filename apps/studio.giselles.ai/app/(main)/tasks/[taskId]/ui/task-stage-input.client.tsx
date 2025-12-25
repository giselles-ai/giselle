"use client";

import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import type { GenerationContextInput, TaskId } from "@giselles-ai/protocol";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { useSelectedStageApp } from "@/app/(main)/stores/stage-app-selection-store";
import { useTaskOverlayStore } from "@/app/(main)/stores/task-overlay-store";
import { TaskCompactStageInput } from "../../../components/stage-input/task-compact-stage-input";
import type { StageApp } from "../../../playground/types";

function pickPreferredInput(
	inputs: GenerationContextInput[],
): GenerationContextInput | null {
	return (
		inputs.find((input) => input.type === "parameters") ??
		inputs.find((input) => input.type === "github-webhook-event") ??
		inputs[0] ??
		null
	);
}

export function TaskStageInput({
	apps,
	sampleApps,
	createAndStartTaskAction,
}: {
	apps: StageApp[];
	sampleApps: StageApp[];
	createAndStartTaskAction: (
		inputs: CreateAndStartTaskInputs,
	) => Promise<TaskId>;
}) {
	const router = useRouter();
	const selectableApps = useMemo(
		() => [...sampleApps, ...apps],
		[sampleApps, apps],
	);

	const [isRunning, startTransition] = useTransition();

	const { selectedApp } = useSelectedStageApp(selectableApps);

	const { showOverlay, hideOverlay } = useTaskOverlayStore(
		useShallow((state) => ({
			showOverlay: state.showOverlay,
			hideOverlay: state.hideOverlay,
		})),
	);

	const handleSubmit = useCallback(
		(event: { inputs: GenerationContextInput[] }) => {
			if (!selectedApp) return;

			showOverlay({
				app: {
					name: selectedApp.name,
					description: selectedApp.description,
					workspaceId: selectedApp.workspaceId,
				},
				input: pickPreferredInput(event.inputs),
			});

			startTransition(async () => {
				try {
					const taskId = await createAndStartTaskAction({
						generationOriginType: "stage",
						nodeId: selectedApp.entryNodeId,
						inputs: event.inputs,
						workspaceId: selectedApp.workspaceId,
					});
					router.push(`/tasks/${taskId}`);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(
						"Failed to create and start task from task page:",
						error,
					);
					hideOverlay();
				}
			});
		},
		[selectedApp, showOverlay, createAndStartTaskAction, router, hideOverlay],
	);

	return (
		<TaskCompactStageInput
			apps={selectableApps}
			onSubmitAction={handleSubmit}
			isRunning={isRunning}
		/>
	);
}
