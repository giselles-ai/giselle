import { useGenerationRunnerSystem } from "../contexts/generation-runner-system";
export function useGenerationController() {
	const { startGeneration, isGenerating } = useGenerationRunnerSystem();
	return { startGeneration, isGenerating };
}
