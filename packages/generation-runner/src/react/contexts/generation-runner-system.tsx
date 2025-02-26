import {
	type CompletedGeneration,
	type CreatedGeneration,
	type FailedGeneration,
	type Generation,
	type GenerationContext,
	GenerationId,
	type GenerationOrigin,
	type NodeId,
	type QueuedGeneration,
	type RunningGeneration,
} from "@giselle-sdk/data-type";
import {
	callAddGenerationApi,
	callGetNodeGenerationsApi,
	callGithubOperationApi,
	callRequestGenerationApi,
} from "@giselle-sdk/giselle-engine/client";
import type { Message } from "ai";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	waitAndGetGenerationCompleted,
	waitAndGetGenerationFailed,
	waitAndGetGenerationRunning,
} from "../../helpers";
import { GenerationRunner } from "../generation-runner";

interface StartGenerationOptions {
	onGenerationCreated?: (generation: CreatedGeneration) => void;
	onGenerationQueued?: (generation: QueuedGeneration) => void;
	onGenerationStarted?: (generation: RunningGeneration) => void;
	onGenerationCompleted?: (generation: CompletedGeneration) => void;
}
export type StartGeneration = (
	generationContext: GenerationContext,
	options?: StartGenerationOptions,
) => Promise<void>;

export interface FetchNodeGenerationsParams {
	nodeId: NodeId;
	origin: GenerationOrigin;
}
type FetchNodeGenerations = (
	params: FetchNodeGenerationsParams,
) => Promise<void>;

interface GenerationRunnerSystemContextType {
	generateTextApi: string;
	startGeneration: StartGeneration;
	getGeneration: (generationId: GenerationId) => Generation | undefined;
	generations: Generation[];
	nodeGenerationMap: Map<NodeId, Generation[]>;
	requestGeneration: (generation: Generation) => Promise<void>;
	updateGenerationStatusToRunning: (
		generationId: GenerationId,
	) => Promise<RunningGeneration | CompletedGeneration | FailedGeneration>;
	updateGenerationStatusToComplete: (
		generationId: GenerationId,
	) => Promise<CompletedGeneration>;
	updateGenerationStatusToFailure: (
		generationId: GenerationId,
	) => Promise<FailedGeneration>;
	updateMessages: (generationId: GenerationId, newMessages: Message[]) => void;
	fetchNodeGenerations: FetchNodeGenerations;
	callGithubOperation: (generationId: GenerationId) => Promise<void>;
}

export const GenerationRunnerSystemContext =
	createContext<GenerationRunnerSystemContextType | null>(null);

interface GenerationRunnerSystemProviderProps {
	children: ReactNode;
	generateTextApi?: string;
}
export function GenerationRunnerSystemProvider({
	children,
	generateTextApi = "/api/giselle/text-generation",
}: GenerationRunnerSystemProviderProps) {
	const [generations, setGenerations] = useState<Generation[]>([]);
	const generationListener = useRef<Record<GenerationId, Generation>>({});

	const nodeGenerationMap = useMemo(() => {
		const tmp = new Map<NodeId, Generation[]>();
		for (const generation of generations) {
			if (generation.status === "created") {
				continue;
			}
			const generations = tmp.get(generation.context.actionNode.id) || [];
			generations.push(generation);
			tmp.set(
				generation.context.actionNode.id,
				generations.sort((a, b) => a.createdAt - b.createdAt),
			);
		}
		return tmp;
	}, [generations]);

	const waitForGeneration = useCallback(
		async (
			generationId: GenerationId,
			options?: {
				timeout?: number;
				onStart?: (generation: RunningGeneration) => void;
				onComplete?: (generation: CompletedGeneration) => void;
				onError?: (generation: FailedGeneration) => void;
			},
		) => {
			let status = generationListener.current[generationId].status;
			const timeoutDuration = options?.timeout || 1000 * 60 * 5;
			const startTime = Date.now();

			while (true) {
				if (Date.now() - startTime > timeoutDuration) {
					throw new Error("Generation timeout");
				}

				const generation = generationListener.current[generationId];
				if (status !== generation.status) {
					status = generation.status;
					if (generation.status === "running") {
						options?.onStart?.(generation);
					}
					if (generation.status === "completed") {
						options?.onComplete?.(generation);
						return generation;
					}
					if (generation.status === "failed") {
						options?.onError?.(generation);
						return generation;
					}
				}

				// Add small delay between checks
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		},
		[],
	);
	const startGeneration = useCallback<StartGeneration>(
		async (generationContext, options = {}) => {
			const generation = {
				id: GenerationId.generate(),
				context: generationContext,
				status: "created",
				createdAt: Date.now(),
			} satisfies CreatedGeneration;
			setGenerations((prev) => [...prev, generation]);
			generationListener.current[generation.id] = generation;
			options?.onGenerationCreated?.(generation);
			const result = await callAddGenerationApi({
				generation,
			});
			options.onGenerationQueued?.(result.generation as QueuedGeneration);
			setGenerations((prev) =>
				prev.map((prevGeneration) =>
					prevGeneration.id === generation.id
						? (result.generation as Generation)
						: prevGeneration,
				),
			);
			await waitForGeneration(generation.id, {
				onStart: options?.onGenerationStarted,
				onComplete: options?.onGenerationCompleted,
			});
		},
		[waitForGeneration],
	);
	const getGeneration = useCallback(
		(generationId: GenerationId) =>
			generations.find((generation) => generation.id === generationId),
		[generations],
	);
	const updateMessages = useCallback(
		(updateGenerationId: GenerationId, newMessages: Message[]) => {
			setGenerations((prevGenerations) =>
				prevGenerations.map((prevGeneration) =>
					prevGeneration.id === updateGenerationId &&
					prevGeneration.status === "running"
						? { ...prevGeneration, messages: newMessages }
						: prevGeneration,
				),
			);
		},
		[],
	);
	const requestGeneration = useCallback(async (generation: Generation) => {
		if (generation && generation.status === "queued") {
			const requestedAt = Date.now();
			setGenerations((prev) =>
				prev.map((prevGeneration) => {
					if (prevGeneration.id !== generation.id) {
						return prevGeneration;
					}
					if (prevGeneration.status !== "queued") {
						return prevGeneration;
					}
					return {
						...prevGeneration,
						status: "requested",
						requestedAt,
					};
				}),
			);
			await callRequestGenerationApi({
				generationId: generation.id,
			});
		}
	}, []);
	const updateGenerationStatusToRunning = useCallback(
		async (generationId: GenerationId) => {
			const generation = await waitAndGetGenerationRunning(generationId);
			setGenerations((prevGenerations) =>
				prevGenerations.map((prevGeneration) =>
					prevGeneration.id !== generation.id ? prevGeneration : generation,
				),
			);
			generationListener.current[generationId] = generation;
			return generation;
		},
		[],
	);
	const updateGenerationStatusToComplete = useCallback(
		async (generationId: GenerationId) => {
			const completedGeneration =
				await waitAndGetGenerationCompleted(generationId);
			setGenerations((prevGenerations) =>
				prevGenerations.map((prevGeneration) =>
					prevGeneration.id !== completedGeneration.id
						? prevGeneration
						: completedGeneration,
				),
			);
			generationListener.current[generationId] = completedGeneration;
			return completedGeneration;
		},
		[],
	);

	const updateGenerationStatusToFailure = useCallback(
		async (generationId: GenerationId) => {
			const failedGeneration = await waitAndGetGenerationFailed(generationId);
			setGenerations((prevGenerations) =>
				prevGenerations.map((prevGeneration) =>
					prevGeneration.id !== failedGeneration.id
						? prevGeneration
						: failedGeneration,
				),
			);
			generationListener.current[generationId] = failedGeneration;
			return failedGeneration;
		},
		[],
	);

	const fetchNodeGenerations = useCallback<FetchNodeGenerations>(
		async ({
			nodeId,
			origin,
		}: { nodeId: NodeId; origin: GenerationOrigin }) => {
			const { generations } = await callGetNodeGenerationsApi({
				origin,
				nodeId,
			});
			setGenerations((prev) => {
				const filtered = prev.filter(
					(p) => !generations.some((g) => g.id === p.id),
				);
				return [...filtered, ...generations].sort(
					(a, b) => a.createdAt - b.createdAt,
				);
			});
		},
		[],
	);
	const callGithubOperation = useCallback(
		async (generationId: GenerationId) => {
			await callGithubOperationApi({ generationId });
		},
		[],
	);
	return (
		<GenerationRunnerSystemContext.Provider
			value={{
				generateTextApi,
				startGeneration,
				getGeneration,
				requestGeneration,
				generations,
				updateGenerationStatusToRunning,
				updateGenerationStatusToComplete,
				updateGenerationStatusToFailure,
				updateMessages,
				nodeGenerationMap,
				fetchNodeGenerations,
				callGithubOperation,
			}}
		>
			{children}
			{generations.map((generation) => (
				<GenerationRunner key={generation.id} generation={generation} />
			))}
		</GenerationRunnerSystemContext.Provider>
	);
}

export function useGenerationRunnerSystem() {
	const context = useContext(GenerationRunnerSystemContext);
	if (!context) {
		throw new Error(
			"useGenerationRunner must be used within a GenerationRunnerProvider",
		);
	}
	return context;
}
