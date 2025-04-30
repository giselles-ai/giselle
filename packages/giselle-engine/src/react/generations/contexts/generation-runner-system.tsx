import type { Message } from "@ai-sdk/react";
import {
	type CancelledGeneration,
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
	isCancelledGeneration,
	isCompletedGeneration,
	isFailedGeneration,
	isRunningGeneration,
} from "@giselle-sdk/data-type";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { useGiselleEngine } from "../../use-giselle-engine";
import { GenerationRunner } from "../generation-runner";
import {
	arrayEquals,
	waitAndGetGenerationCompleted,
	waitAndGetGenerationFailed,
	waitAndGetGenerationRunning,
} from "../helpers";

interface StartGenerationOptions {
	onGenerationCreated?: (generation: CreatedGeneration) => void;
	onGenerationQueued?: (generation: QueuedGeneration) => void;
	onGenerationStarted?: (generation: RunningGeneration) => void;
	onGenerationCompleted?: (generation: CompletedGeneration) => void;
	onGenerationCancelled?: (generation: CancelledGeneration) => void;
	onGenerationFailed?: (generation: FailedGeneration) => void;
	onUpdateMessages?: (generation: RunningGeneration) => void;
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
	updateMessages: (generationId: GenerationId, newMessages: Message[]) => void;
	fetchNodeGenerations: FetchNodeGenerations;
	addStopHandler: (generationId: GenerationId, handler: () => void) => void;
	stopGeneration: (generationId: GenerationId) => Promise<void>;
}

export const GenerationRunnerSystemContext =
	createContext<GenerationRunnerSystemContextType | null>(null);

interface GenerationRunnerSystemProviderProps {
	children: ReactNode;
	generateTextApi?: string;
}
export function GenerationRunnerSystemProvider({
	children,
	generateTextApi = "/api/giselle/generateText",
}: GenerationRunnerSystemProviderProps) {
	const client = useGiselleEngine();
	const [generations, setGenerations] = useState<Generation[]>([]);
	const stopHandlersRef = useRef<Record<GenerationId, () => void>>({});
	const generationListener = useRef<Record<GenerationId, Generation>>({});

	const nodeGenerationMap = useMemo(() => {
		const tmp = new Map<NodeId, Generation[]>();
		for (const generation of generations) {
			if (generation.status === "created") {
				continue;
			}
			const generations = tmp.get(generation.context.operationNode.id) || [];
			generations.push(generation);
			tmp.set(
				generation.context.operationNode.id,
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
				onCancel?: (generation: CancelledGeneration) => void;
				onUpdateMessages?: (generation: RunningGeneration) => void;
			},
		) => {
			let status = generationListener.current[generationId].status;
			const messages = generationListener.current[generationId].messages;
			const timeoutDuration = options?.timeout || 1000 * 800; // The maximum duration of through enabled fluid compute. https://vercel.com/docs/functions/runtimes#max-duration
			const startTime = Date.now();

			while (true) {
				if (Date.now() - startTime > timeoutDuration) {
					const generation = generationListener.current[generationId];

					const failedGeneration = {
						id: generation.id,
						context: generation.context,
						createdAt: generation.createdAt,
						queuedAt: generation.queuedAt ?? Date.now(),
						startedAt: generation.startedAt ?? Date.now(),
						status: "failed",
						failedAt: Date.now(),
						messages: generation.messages ?? [],
						error: {
							name: "Generation timed out",
							message: "Generation timed out",
							dump: "timeout",
						},
					} satisfies FailedGeneration;
					options?.onError?.(failedGeneration);
					stopHandlersRef.current[generation.id]?.();
					setGenerations((prevGenerations) =>
						prevGenerations.map((prevGeneration) =>
							prevGeneration.id !== failedGeneration.id
								? prevGeneration
								: failedGeneration,
						),
					);
					generationListener.current[generationId] = failedGeneration;
					return;
				}

				const generation = generationListener.current[generationId];
				if (status !== generation.status) {
					status = generation.status;
					if (isRunningGeneration(generation)) {
						options?.onStart?.(generation);
					}
					if (isCompletedGeneration(generation)) {
						options?.onComplete?.(generation);
						return generation;
					}
					if (isFailedGeneration(generation)) {
						options?.onError?.(generation);
						return generation;
					}
					if (isCancelledGeneration(generation)) {
						options?.onCancel?.(generation);
						return generation;
					}
				}
				if (
					isRunningGeneration(generation) &&
					!arrayEquals(messages, generation.messages)
				) {
					options?.onUpdateMessages?.(generation);
				}

				// Add small delay between checks
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		},
		[],
	);
	const startGeneration = useCallback<StartGeneration>(
		async (generationContext, options = {}) => {
			const generationId = GenerationId.generate();
			const createdGeneration = {
				id: generationId,
				context: generationContext,
				status: "created",
				createdAt: Date.now(),
			} satisfies CreatedGeneration;
			setGenerations((prev) => [...prev, createdGeneration]);
			generationListener.current[createdGeneration.id] = createdGeneration;
			options?.onGenerationCreated?.(createdGeneration);

			/** @todo split create and start */

			const queuedGeneration = {
				...createdGeneration,
				status: "queued",
				queuedAt: Date.now(),
			} satisfies QueuedGeneration;
			options.onGenerationQueued?.(queuedGeneration);
			setGenerations((prev) =>
				prev.map((prevGeneration) =>
					prevGeneration.id === generationId
						? queuedGeneration
						: prevGeneration,
				),
			);
			await waitForGeneration(createdGeneration.id, {
				onStart: options?.onGenerationStarted,
				onComplete: options?.onGenerationCompleted,
				onUpdateMessages: options?.onUpdateMessages,
				onCancel: options?.onGenerationCancelled,
				onError: options?.onGenerationFailed,
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

			const currentGeneration = generationListener.current[updateGenerationId];
			generationListener.current[updateGenerationId] = {
				...currentGeneration,
				messages: newMessages,
			} as RunningGeneration;
		},
		[],
	);
	const updateGenerationStatusToRunning = useCallback(
		async (generationId: GenerationId) => {
			const generation = await waitAndGetGenerationRunning(
				(generationId) => client.getGeneration({ generationId }),
				generationId,
			);
			setGenerations((prevGenerations) =>
				prevGenerations.map((prevGeneration) =>
					prevGeneration.id !== generation.id ? prevGeneration : generation,
				),
			);
			generationListener.current[generationId] = generation;
			return generation;
		},
		[client],
	);
	const updateGenerationStatusToComplete = useCallback(
		async (generationId: GenerationId) => {
			const completedGeneration = await waitAndGetGenerationCompleted(
				(generationId) => client.getGeneration({ generationId }),
				generationId,
			);
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
		[client],
	);

	const updateGenerationStatusToFailure = useCallback(
		async (generationId: GenerationId) => {
			const failedGeneration = await waitAndGetGenerationFailed(
				(generationId) => client.getGeneration({ generationId }),
				generationId,
			);
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
		[client],
	);

	const fetchNodeGenerations = useCallback<FetchNodeGenerations>(
		async ({
			nodeId,
			origin,
		}: { nodeId: NodeId; origin: GenerationOrigin }) => {
			const generations = await client.getNodeGenerations({
				origin,
				nodeId,
			});
			const excludeCancelled = generations.filter(
				(generation) => generation.status !== "cancelled",
			);
			setGenerations((prev) => {
				const filtered = prev.filter(
					(p) => !excludeCancelled.some((g) => g.id === p.id),
				);
				return [...filtered, ...excludeCancelled].sort(
					(a, b) => a.createdAt - b.createdAt,
				);
			});
		},
		[client],
	);

	const addStopHandler = useCallback(
		(generationId: GenerationId, handler: () => void) => {
			stopHandlersRef.current[generationId] = handler;
		},
		[],
	);

	const stopGeneration = useCallback(
		async (generationId: GenerationId) => {
			const handler = stopHandlersRef.current[generationId];
			if (handler) {
				handler();
				setGenerations((prevGenerations) =>
					prevGenerations.map((prevGeneration) => {
						if (prevGeneration.id !== generationId) {
							return prevGeneration;
						}
						return {
							...prevGeneration,
							status: "cancelled",
							cancelledAt: Date.now(),
						} as CancelledGeneration;
					}),
				);
				await client.cancelGeneration({
					generationId,
				});
			}

			const currentGeneration = generationListener.current[generationId];
			generationListener.current[generationId] = {
				...currentGeneration,
				status: "cancelled",
				cancelledAt: Date.now(),
			} as CancelledGeneration;
		},
		[client],
	);

	return (
		<GenerationRunnerSystemContext.Provider
			value={{
				generateTextApi,
				startGeneration,
				getGeneration,
				generations,
				updateGenerationStatusToRunning,
				updateGenerationStatusToComplete,
				updateGenerationStatusToFailure,
				updateMessages,
				nodeGenerationMap,
				fetchNodeGenerations,
				addStopHandler,
				stopGeneration,
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
