import type { NodeId } from "@giselle-sdk/data-type";
import type { UIMessage } from "ai";
import { createContext, useContext } from "react";
import type {
	CancelledGeneration,
	CompletedGeneration,
	CreatedGeneration,
	FailedGeneration,
	Generation,
	GenerationContext,
	GenerationOrigin,
	QueuedGeneration,
	RunningGeneration,
} from "../../../concepts/generation";
import type { GenerationId } from "../../../concepts/identifiers";

export type CreateGenerationRunner = (
	generationContext: GenerationContext,
) => CreatedGeneration;

interface StartGenerationOptions {
	onGenerationQueued?: (generation: QueuedGeneration) => void;
	onGenerationStarted?: (generation: RunningGeneration) => void;
	onGenerationCompleted?: (generation: CompletedGeneration) => void;
	onGenerationCancelled?: (generation: CancelledGeneration) => void;
	onGenerationFailed?: (generation: FailedGeneration) => void | Promise<void>;
	onUpdateMessages?: (generation: RunningGeneration) => void;
}
export type StartGenerationRunner = (
	id: GenerationId,
	options?: StartGenerationOptions,
) => Promise<void>;

interface CreateAndStartGenerationOptions extends StartGenerationOptions {
	onGenerationCreated?: (generation: CreatedGeneration) => void;
}
export type CreateAndStartGenerationRunner = (
	generationContext: GenerationContext,
	options?: CreateAndStartGenerationOptions,
) => Promise<void>;

export interface FetchNodeGenerationsParams {
	nodeId: NodeId;
	origin: GenerationOrigin;
}

interface GenerationRunnerSystemContextValue {
	generateTextApi: string;
	createGenerationRunner: CreateGenerationRunner;
	startGenerationRunner: StartGenerationRunner;
	createAndStartGenerationRunner: CreateAndStartGenerationRunner;
	updateGenerationStatusToRunning: (
		generationId: GenerationId,
	) => Promise<
		| RunningGeneration
		| CompletedGeneration
		| FailedGeneration
		| CancelledGeneration
	>;
	updateGenerationStatusToComplete: (
		generationId: GenerationId,
	) => Promise<CompletedGeneration>;
	updateGenerationStatusToFailure: (
		generationId: GenerationId,
	) => Promise<FailedGeneration>;
	updateMessages: (
		generationId: GenerationId,
		newMessages: UIMessage[],
	) => void;
	addStopHandler: (generationId: GenerationId, handler: () => void) => void;
	stopGenerationRunner: (generationId: GenerationId) => Promise<void>;
	addGenerationRunner: (generations: Generation | Generation[]) => void;
}

export const GenerationRunnerSystemContext =
	createContext<GenerationRunnerSystemContextValue | null>(null);

export function useGenerationRunnerSystem() {
	const context = useContext(GenerationRunnerSystemContext);
	if (!context) {
		throw new Error(
			"useGenerationRunner must be used within a GenerationRunnerProvider",
		);
	}
	return context;
}
