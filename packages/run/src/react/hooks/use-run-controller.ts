import type { Run } from "@giselle-sdk/data-type";
import { useCallback, useState } from "react";
import { type Cancel, type Perform, useRunSystem } from "../contexts";

interface UseRunControllerHelpers {
	perform: Perform;
	isRunning: boolean;
	runs: Run[];
	cancel: () => void;
}

export function useRunController(): UseRunControllerHelpers {
	const {
		runs,
		perform: performSystem,
		isRunning,
		cancel: cancelSystem,
	} = useRunSystem();
	const [performingRun, setPerformingRun] = useState<Run | undefined>();
	const cancel = useCallback(() => {
		if (performingRun === undefined) {
			return;
		}
		cancelSystem(performingRun.id);
	}, [cancelSystem, performingRun]);

	const perform = useCallback<Perform>(
		(workflowId, options) =>
			performSystem(workflowId, {
				...options,
				onCreateRun: (run) => {
					setPerformingRun(run);
					options?.onCreateRun?.(run);
				},
			}),
		[performSystem],
	);

	return {
		runs,
		isRunning,
		perform,
		cancel,
	};
}
