"use client";

import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import type {
	GenerationContextInput,
	ParametersInput,
	TaskId,
} from "@giselles-ai/protocol";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { useShallow } from "zustand/shallow";
import { useTaskOverlayStore } from "@/app/(main)/stores/task-overlay-store";
import { TaskCompactStageInput } from "../../../components/stage-input/task-compact-stage-input";
import type { StageApp } from "../../../playground/types";

export function TaskStageInput({
	apps,
	sampleApps,
	initialSelectedAppId,
	createAndStartTaskAction,
}: {
	apps: StageApp[];
	sampleApps: StageApp[];
	initialSelectedAppId?: string;
	createAndStartTaskAction: (
		inputs: CreateAndStartTaskInputs,
	) => Promise<TaskId>;
}) {
	const router = useRouter();
	const selectableApps = useMemo(
		() => [...sampleApps, ...apps],
		[sampleApps, apps],
	);

	const [selectedAppId, setSelectedAppId] = useState<string | undefined>(
		initialSelectedAppId,
	);
	const [isRunning, startTransition] = useTransition();

	const selectedApp = selectedAppId
		? selectableApps.find((app) => app.id === selectedAppId)
		: undefined;

	useEffect(() => {
		if (
			selectedAppId &&
			!selectableApps.some((app) => app.id === selectedAppId)
		) {
			setSelectedAppId(selectableApps[0]?.id);
		}
		if (!selectedAppId && selectableApps.length > 0) {
			setSelectedAppId(selectableApps[0]?.id);
		}
	}, [selectedAppId, selectableApps]);

	const { showOverlay, hideOverlay } = useTaskOverlayStore(
		useShallow((state) => ({
			showOverlay: state.showOverlay,
			hideOverlay: state.hideOverlay,
		})),
	);

	const handleSubmit = useCallback(
		(event: { inputs: GenerationContextInput[] }) => {
			if (!selectedApp) return;

			const parametersInput = event.inputs.find(
				(input): input is ParametersInput => input.type === "parameters",
			);
			showOverlay({
				app: {
					name: selectedApp.name,
					description: selectedApp.description,
					workspaceId: selectedApp.workspaceId,
				},
				input: parametersInput ?? null,
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
			selectedApp={selectedApp}
			apps={selectableApps}
			scope="task"
			onSubmitAction={handleSubmit}
			isRunning={isRunning}
		/>
	);
}
