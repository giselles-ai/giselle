import type { Run } from "@giselle-sdk/data-type";
import { type Perform, useRunSystem } from "../contexts";

interface UseRunControllerHelpers {
	perform: Perform;
	isRunning: boolean;
	runs: Run[];
}

export function useRunController(): UseRunControllerHelpers {
	const { runs, perform, isRunning } = useRunSystem();
	return {
		runs,
		isRunning,
		perform,
	};
}
