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

// Primitive types from the API (matching @giselles-ai/protocol)
type PrimitiveStep = {
	id: string;
	status: string;
	name: string;
	generationId: string;
	duration: number;
	usage: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
	};
};

type PrimitiveSequence = {
	id: string;
	steps: PrimitiveStep[];
	status: string;
	duration: {
		wallClock: number;
		totalTask: number;
	};
	usage: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
	};
};

type PrimitiveTask = {
	id: string;
	workspaceId: string;
	name: string;
	status: string;
	sequences: PrimitiveSequence[];
	nodeIdsConnectedToEnd?: string[];
};

type PrimitiveGenerationOutput = {
	type: string;
	outputId: string;
	content?: string;
	contents?: unknown[];
	sources?: unknown[];
};

type PrimitiveGeneration = {
	id: string;
	status: string;
	context: {
		operationNode: {
			id: string;
			type: string;
		};
	};
	outputs?: PrimitiveGenerationOutput[];
	error?: {
		name: string;
		message: string;
	};
};

type PrimitiveTaskResponse = {
	task: PrimitiveTask;
	generations?: Record<string, PrimitiveGeneration>;
};

// SDK public types (user-friendly format)
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

function isOperationNode(node: { type: string }): boolean {
	return node.type === "operation";
}

function isCompletedGeneration(
	generation: PrimitiveGeneration,
): generation is PrimitiveGeneration & {
	outputs: PrimitiveGenerationOutput[];
} {
	return generation.status === "completed" && Array.isArray(generation.outputs);
}

function isFailedGeneration(
	generation: PrimitiveGeneration,
): generation is PrimitiveGeneration & {
	error: { name: string; message: string };
} {
	return generation.status === "failed" && generation.error !== undefined;
}

/**
 * Transform primitive API response to SDK-friendly format.
 * This transformation logic was moved from the server-side route handler
 * to keep the API primitive and let SDK handle the presentation layer.
 */
function transformTaskResponse(response: PrimitiveTaskResponse): AppTaskResult {
	const { task, generations } = response;

	// If no generations, return minimal task with status
	if (!generations || Object.keys(generations).length === 0) {
		return { task: { status: task.status } as TaskWithStatus };
	}

	const generationsById = generations;

	// Transform sequences to steps
	const steps: AppTaskStep[] = task.sequences.map((sequence, sequenceIndex) => {
		const items: AppTaskStepItem[] = [];

		for (const step of sequence.steps) {
			const generation = generationsById[step.generationId];
			if (!generation) {
				continue;
			}
			const operationNode = generation.context.operationNode;
			if (!isOperationNode(operationNode)) {
				continue;
			}

			if (isCompletedGeneration(generation)) {
				items.push({
					id: step.id,
					title: step.name,
					status: generation.status,
					generationId: generation.id,
					outputs: generation.outputs as unknown[],
				});
			} else if (isFailedGeneration(generation)) {
				items.push({
					id: step.id,
					title: step.name,
					status: generation.status,
					generationId: generation.id,
					error: generation.error.message,
				});
			} else {
				items.push({
					id: step.id,
					title: step.name,
					status: generation.status,
					generationId: generation.id,
				});
			}
		}

		return {
			title: `Step ${sequenceIndex + 1}`,
			status: sequence.status,
			items,
		};
	});

	// Find outputs connected to end node
	const allStepItems = steps.flatMap((step) => step.items);
	const outputs: AppTaskOutput[] = [];

	for (const nodeId of task.nodeIdsConnectedToEnd ?? []) {
		const match = allStepItems.find((item) => {
			const generation = generationsById[item.generationId];
			if (!generation) {
				return false;
			}
			return generation.context.operationNode.id === nodeId;
		});
		if (!match) {
			continue;
		}
		const generation = generationsById[match.generationId];
		if (!generation || !isCompletedGeneration(generation)) {
			continue;
		}
		outputs.push({
			title: match.title,
			generationId: generation.id,
			outputs: generation.outputs as unknown[],
		});
	}

	return {
		task: {
			id: task.id,
			status: task.status,
			workspaceId: task.workspaceId,
			name: task.name,
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

	const status = (task as { status?: unknown }).status;
	if (typeof status !== "string" || status.length === 0) {
		throw new Error("Invalid response JSON");
	}

	// Check if this is a primitive response with generations (new format)
	const generations = (json as { generations?: unknown }).generations;
	if (generations !== undefined) {
		// New primitive format: transform to SDK format
		return transformTaskResponse(json as PrimitiveTaskResponse);
	}

	// Legacy format: check for already-transformed shape
	const steps = (task as { steps?: unknown }).steps;
	const outputs = (task as { outputs?: unknown }).outputs;

	const hasFinalResultShape = Array.isArray(steps) && Array.isArray(outputs);
	if (!hasFinalResultShape) {
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
