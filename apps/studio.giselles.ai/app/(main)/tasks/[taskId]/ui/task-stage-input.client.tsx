"use client";

import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import type { GenerationContextInput, TaskId } from "@giselles-ai/protocol";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useShallow } from "zustand/shallow";
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
	createAndStartTaskAction,
	initialSelectedAppId,
}: {
	apps: StageApp[];
	createAndStartTaskAction: (
		inputs: CreateAndStartTaskInputs,
	) => Promise<TaskId>;
	initialSelectedAppId?: string;
}) {
	const router = useRouter();
	const [selectedAppId, setSelectedAppId] = useState<string | undefined>(
		initialSelectedAppId,
	);

	const [isRunning, startTransition] = useTransition();

	const { showOverlay, hideOverlay } = useTaskOverlayStore(
		useShallow((state) => ({
			showOverlay: state.showOverlay,
			hideOverlay: state.hideOverlay,
		})),
	);

	const handleSubmit = useCallback(
		(event: { inputs: GenerationContextInput[]; selectedApp: StageApp }) => {
			showOverlay({
				app: {
					name: event.selectedApp.name,
					description: event.selectedApp.description,
					workspaceId: event.selectedApp.workspaceId,
				},
				input: pickPreferredInput(event.inputs),
			});

			startTransition(async () => {
				try {
					const taskId = await createAndStartTaskAction({
						generationOriginType: "stage",
						nodeId: event.selectedApp.entryNodeId,
						inputs: event.inputs,
						workspaceId: event.selectedApp.workspaceId,
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
		[showOverlay, createAndStartTaskAction, router, hideOverlay],
	);

	return (
		<TaskCompactStageInput
			apps={apps}
			selectedAppId={selectedAppId}
			setSelectedAppId={setSelectedAppId}
			onSubmitAction={handleSubmit}
			isRunning={isRunning}
		/>
	);
}
