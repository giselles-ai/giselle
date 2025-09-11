import { useCallback } from "react";
import type { Generation } from "../../concepts/generation";
import type { ActExecutorOptions, CreateActInputs } from "../../engine/acts";
import { executeAct } from "../../engine/acts/shared/act-execution-utils";
import { useWorkflowDesigner } from "../flow";
import { useGenerationRunnerSystem } from "../generations";
import { useGiselleEngine } from "../use-giselle-engine";

type CreateAndStartActParams = Omit<
	CreateActInputs,
	"generationOriginType" | "workspace" | "workspaceId"
> &
	Omit<
		ActExecutorOptions,
		| "act"
		| "applyPatches"
		| "generationAdapter"
		| "onActStart"
		| "onActComplete"
		| "startGeneration"
	> & {
		onActStart?: (options: {
			cancel: () => Promise<void>;
			actId: string;
		}) => void | Promise<void>;
		onActComplete?: (options: {
			hasError: boolean;
			duration: number;
			actId: string;
		}) => void | Promise<void>;
	};

export function useActController() {
	const { data } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const { addGenerationRunner, startGenerationRunner, stopGenerationRunner } =
		useGenerationRunnerSystem();

	const createAndStartAct = useCallback(
		async ({
			connectionIds,
			nodeId,
			inputs,
			...options
		}: CreateAndStartActParams) => {
			const { act, generations } = await client.createAct({
				connectionIds,
				nodeId,
				workspaceId: data.id,
				generationOriginType: "studio",
				inputs,
			});
			addGenerationRunner(generations);

			const { onActStart, onActComplete, ...rest } = options;

			await executeAct({
				...rest,
				act,
				applyPatches: async (actId, patches) => {
					await client.patchAct({ actId, patches });
				},
				startGeneration: async (generationId, callbacks) => {
					await startGenerationRunner(generationId, {
						onGenerationCompleted: callbacks?.onCompleted,
						onGenerationFailed: callbacks?.onFailed,
					});
				},
				onActStart: async () => {
					await onActStart?.({
						cancel: async () => {
							await Promise.all(
								generations.map((generation) =>
									stopGenerationRunner(generation.id),
								),
							);
						},
						actId: act.id,
					});
				},
				onActComplete: async (hasError, duration) => {
					await onActComplete?.({ hasError, duration, actId: act.id });
				},
			});
		},
		[
			data,
			client,
			addGenerationRunner,
			startGenerationRunner,
			stopGenerationRunner,
		],
	);

	return {
		createAndStartAct,
	};
}
