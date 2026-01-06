import {
	ApiError,
	ConfigurationError,
	TimeoutError,
	UnsupportedFeatureError,
} from "./errors";

export type GiselleOptions = {
	/**
	 * Base URL of the Studio instance (e.g. "https://studio.giselles.ai").
	 * Defaults to "https://studio.giselles.ai".
	 */
	baseUrl?: string;
	/**
	 * Secret key token (e.g. "gsk_xxx.yyy"). Sent as `Authorization: Bearer <token>`.
	 */
	apiKey?: string;
	/**
	 * Dependency-injected fetch implementation for tests and nonstandard runtimes.
	 */
	fetch?: typeof fetch;
};

export type AppRunInput = {
	text: string;
	/**
	 * Reserved for future file support. Currently rejected.
	 */
	file?: string;
};

export type AppRunArgs = {
	appId: string;
	input: AppRunInput;
};

export type AppRunResult = {
	taskId: string;
};

export type AppRunAndWaitArgs = AppRunArgs & {
	/**
	 * Poll interval for status checks.
	 */
	pollIntervalMs?: number;
	/**
	 * Overall timeout for waiting task completion.
	 */
	timeoutMs?: number;
};

const defaultBaseUrl = "https://studio.giselles.ai";
const defaultPollIntervalMs = 1000;
const defaultTimeoutMs = 20 * 60 * 1000;

function joinPath(baseUrl: string, path: string): string {
	const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
	const cleanPath = path.startsWith("/") ? path.slice(1) : path;
	return new URL(cleanPath, base).toString();
}

async function readResponseText(response: Response): Promise<string> {
	try {
		return await response.text();
	} catch {
		return "";
	}
}

function parseRunResponseJson(json: unknown): AppRunResult {
	if (typeof json !== "object" || json === null) {
		throw new Error("Invalid response JSON");
	}
	const taskId = (json as { taskId?: unknown }).taskId;
	if (typeof taskId !== "string" || taskId.length === 0) {
		throw new Error("Invalid response JSON");
	}
	return { taskId };
}

type TaskWithStatus = { status: string } & Record<string, unknown>;

export type AppTaskStepItem = {
	id: string;
	title: string;
	status: string;
	generationId: string;
	outputs?: unknown[];
	error?: string;
};

export type AppTaskStep = {
	title: string;
	status: string;
	items: AppTaskStepItem[];
};

export type AppTaskOutput = {
	title: string;
	generationId: string;
	outputs: unknown[];
};

export type AppTask =
	| TaskWithStatus
	| {
			id: string;
			workspaceId: string;
			name: string;
			steps: AppTaskStep[];
			outputs: AppTaskOutput[];
			status: string;
	  };

export type AppTaskResult = {
	task: AppTask;
};

type PrimitiveTask = {
	id: string;
	workspaceId: string;
	name: string;
	status: string;
	sequences?: unknown;
	nodeIdsConnectedToEnd?: unknown;
} & Record<string, unknown>;

type PrimitiveGeneration = {
	id: string;
	status: string;
	outputs?: unknown;
	error?: { message?: unknown };
	context?: { operationNode?: { id?: unknown } };
} & Record<string, unknown>;

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}

function buildSdkTaskFromPrimitives(args: {
	task: PrimitiveTask;
	generations: PrimitiveGeneration[];
}): AppTaskResult {
	const generationsById = new Map(
		args.generations
			.filter((g) => isNonEmptyString(g.id))
			.map((g) => [g.id, g]),
	);

	const sequences = args.task.sequences;
	if (!Array.isArray(sequences)) {
		// Fall back to status-only shape.
		return { task: args.task as TaskWithStatus };
	}

	const steps: AppTaskStep[] = sequences.map((sequence, sequenceIndex) => {
		const sequenceStatus = isObject(sequence) ? sequence.status : undefined;
		const sequenceSteps = isObject(sequence) ? sequence.steps : undefined;

		const items: AppTaskStepItem[] = Array.isArray(sequenceSteps)
			? sequenceSteps
					.map((step): AppTaskStepItem | null => {
						if (!isObject(step)) return null;
						const generationId = step.generationId;
						if (!isNonEmptyString(generationId)) return null;
						const generation = generationsById.get(generationId);
						if (!generation) return null;

						const operationNodeId = generation.context?.operationNode?.id;
						if (!isNonEmptyString(operationNodeId)) return null;

						const title = isNonEmptyString(step.name) ? step.name : "";
						const status = generation.status;
						if (!isNonEmptyString(status)) return null;

						if (status === "completed") {
							const outputs = Array.isArray(generation.outputs)
								? (generation.outputs as unknown[])
								: undefined;
							return outputs
								? ({
										id: isNonEmptyString(step.id) ? step.id : generationId,
										title,
										status,
										generationId,
										outputs,
									} satisfies AppTaskStepItem)
								: ({
										id: isNonEmptyString(step.id) ? step.id : generationId,
										title,
										status,
										generationId,
									} satisfies AppTaskStepItem);
						}
						if (status === "failed") {
							const message = generation.error?.message;
							return {
								id: isNonEmptyString(step.id) ? step.id : generationId,
								title,
								status,
								generationId,
								error: isNonEmptyString(message)
									? message
									: "Generation failed",
							} satisfies AppTaskStepItem;
						}
						return {
							id: isNonEmptyString(step.id) ? step.id : generationId,
							title,
							status,
							generationId,
						} satisfies AppTaskStepItem;
					})
					.filter((item): item is AppTaskStepItem => item !== null)
			: [];

		return {
			title: `Step ${sequenceIndex + 1}`,
			status: isNonEmptyString(sequenceStatus) ? sequenceStatus : "",
			items,
		} satisfies AppTaskStep;
	});

	const allStepItems = steps.flatMap((step) => step.items);
	const nodeIdsConnectedToEnd = args.task.nodeIdsConnectedToEnd;
	const outputs: AppTaskOutput[] = Array.isArray(nodeIdsConnectedToEnd)
		? nodeIdsConnectedToEnd
				.map((nodeId) => {
					if (!isNonEmptyString(nodeId)) return null;
					const match = allStepItems.find((item) => {
						const generation = generationsById.get(item.generationId);
						return generation?.context?.operationNode?.id === nodeId;
					});
					if (!match) return null;

					const generation = generationsById.get(match.generationId);
					if (!generation || generation.status !== "completed") return null;

					const genOutputs = generation.outputs;
					if (!Array.isArray(genOutputs)) return null;

					return {
						title: match.title,
						generationId: generation.id,
						outputs: genOutputs as unknown[],
					} satisfies AppTaskOutput;
				})
				.filter((output): output is AppTaskOutput => output !== null)
		: [];

	return {
		task: {
			id: args.task.id,
			status: args.task.status,
			workspaceId: args.task.workspaceId,
			name: args.task.name,
			steps,
			outputs,
		},
	};
}

function parseTaskResponseJson(json: unknown): AppTaskResult {
	if (typeof json !== "object" || json === null) {
		throw new Error("Invalid response JSON");
	}
	const task = (json as { task?: unknown }).task;
	if (typeof task !== "object" || task === null) {
		throw new Error("Invalid response JSON");
	}

	// New primitive shape: `{ task, generations }` (SDK is responsible for shaping).
	const generations = (json as { generations?: unknown }).generations;
	if (Array.isArray(generations)) {
		const id = (task as { id?: unknown }).id;
		const workspaceId = (task as { workspaceId?: unknown }).workspaceId;
		const name = (task as { name?: unknown }).name;
		const status = (task as { status?: unknown }).status;
		if (
			isNonEmptyString(id) &&
			isNonEmptyString(workspaceId) &&
			typeof name === "string" &&
			isNonEmptyString(status)
		) {
			return buildSdkTaskFromPrimitives({
				task: task as PrimitiveTask,
				generations: generations as PrimitiveGeneration[],
			});
		}
	}

	const steps = (task as { steps?: unknown }).steps;
	const outputs = (task as { outputs?: unknown }).outputs;

	const hasFinalResultShape = Array.isArray(steps) && Array.isArray(outputs);
	if (!hasFinalResultShape) {
		const status = (task as { status?: unknown }).status;
		if (typeof status !== "string" || status.length === 0) {
			throw new Error("Invalid response JSON");
		}
		return { task: task as TaskWithStatus };
	}

	const taskId = (task as { id?: unknown }).id;
	if (typeof taskId !== "string" || taskId.length === 0) {
		throw new Error("Invalid response JSON");
	}
	const workspaceId = (task as { workspaceId?: unknown }).workspaceId;
	if (typeof workspaceId !== "string" || workspaceId.length === 0) {
		throw new Error("Invalid response JSON");
	}
	const name = (task as { name?: unknown }).name;
	if (typeof name !== "string") {
		throw new Error("Invalid response JSON");
	}

	const status = (task as { status?: unknown }).status;
	if (typeof status !== "string" || status.length === 0) {
		throw new Error("Invalid response JSON");
	}

	return {
		task: task as {
			id: string;
			workspaceId: string;
			name: string;
			steps: AppTaskStep[];
			outputs: AppTaskOutput[];
			status: string;
		},
	};
}

export default class Giselle {
	readonly app: {
		run: (args: AppRunArgs) => Promise<AppRunResult>;
		runAndWait: (args: AppRunAndWaitArgs) => Promise<AppTaskResult>;
	};

	readonly #fetch: typeof fetch;
	readonly #baseUrl: string;
	readonly #apiKey?: string;

	constructor(options: GiselleOptions = {}) {
		this.#fetch = options.fetch ?? fetch;
		this.#baseUrl = options.baseUrl ?? defaultBaseUrl;
		this.#apiKey = options.apiKey;

		this.app = {
			run: (args) => this.#runApp(args),
			runAndWait: (args) => this.#runAppAndWait(args),
		};
	}

	async #runApp(args: AppRunArgs): Promise<AppRunResult> {
		if (!this.#apiKey) {
			throw new ConfigurationError("`apiKey` is required");
		}
		if (args.input.file !== undefined) {
			throw new UnsupportedFeatureError(
				"`input.file` is not supported yet. Only `{ text: string }` is accepted by the current Runs API.",
			);
		}

		const url = joinPath(this.#baseUrl, `/api/apps/${args.appId}/run`);
		const response = await this.#fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.#apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ text: args.input.text }),
		});

		if (!response.ok) {
			const responseText = await readResponseText(response);
			throw new ApiError(
				`Runs API request failed: ${response.status} ${response.statusText}`,
				response.status,
				responseText,
			);
		}

		let json: unknown;
		try {
			json = await response.json();
		} catch {
			throw new ApiError(
				"Runs API returned invalid JSON",
				response.status,
				await readResponseText(response),
			);
		}
		try {
			return parseRunResponseJson(json);
		} catch (e) {
			throw new ApiError(
				e instanceof Error ? e.message : "Runs API returned invalid JSON",
				response.status,
				"",
			);
		}
	}

	async #getTask(args: {
		appId: string;
		taskId: string;
		includeGenerations: boolean;
	}): Promise<AppTaskResult> {
		if (!this.#apiKey) {
			throw new ConfigurationError("`apiKey` is required");
		}

		const url = new URL(
			joinPath(this.#baseUrl, `/api/apps/${args.appId}/tasks/${args.taskId}`),
		);
		if (args.includeGenerations) {
			url.searchParams.set("includeGenerations", "1");
		}

		const response = await this.#fetch(url.toString(), {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.#apiKey}`,
			},
		});

		if (!response.ok) {
			const responseText = await readResponseText(response);
			throw new ApiError(
				`Tasks API request failed: ${response.status} ${response.statusText}`,
				response.status,
				responseText,
			);
		}

		let json: unknown;
		try {
			json = await response.json();
		} catch {
			throw new ApiError(
				"Tasks API returned invalid JSON",
				response.status,
				await readResponseText(response),
			);
		}

		try {
			return parseTaskResponseJson(json);
		} catch (e) {
			throw new ApiError(
				e instanceof Error ? e.message : "Tasks API returned invalid JSON",
				response.status,
				"",
			);
		}
	}

	async #runAppAndWait(args: AppRunAndWaitArgs): Promise<AppTaskResult> {
		const { taskId } = await this.#runApp(args);

		const pollIntervalMs = args.pollIntervalMs ?? defaultPollIntervalMs;
		const timeoutMs = args.timeoutMs ?? defaultTimeoutMs;
		const deadline = Date.now() + timeoutMs;

		// Poll status-only until terminal.
		while (true) {
			const { task } = await this.#getTask({
				appId: args.appId,
				taskId,
				includeGenerations: false,
			});

			if (
				task.status === "completed" ||
				task.status === "failed" ||
				task.status === "cancelled"
			) {
				break;
			}

			if (Date.now() >= deadline) {
				throw new TimeoutError(
					`Timed out waiting for task completion (taskId: ${taskId})`,
				);
			}

			await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
		}

		// Fetch full results at the end.
		return await this.#getTask({
			appId: args.appId,
			taskId,
			includeGenerations: true,
		});
	}
}
