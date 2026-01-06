import {
	Generation,
	GenerationId,
	type GenerationOutput,
	GenerationStatus,
	StepId,
	Task,
	isCompletedGeneration,
	isFailedGeneration,
	isOperationNode,
} from "@giselles-ai/protocol";
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

export type AppRunResult = Task;

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
	const result = Task.safeParse(json);
	if (!result.success) {
		console.error("Zod Parse Error:", JSON.stringify(result.error, null, 2));
		throw new Error("Invalid response JSON");
	}
	return result.data;
}

export type AppTaskStepItem = {
	id: StepId;
	title: string;
	status: GenerationStatus;
	generationId: GenerationId;
	outputs?: GenerationOutput[];
	error?: string;
};

export type AppTaskStep = {
	title: string;
	status: GenerationStatus;
	items: AppTaskStepItem[];
};

export type AppTaskOutput = {
	title: string;
	generationId: GenerationId;
	outputs: GenerationOutput[];
};

export type AppTask = Omit<Task, "steps"> & {
	/**
	 * Steps arranged for the App view.
	 */
	steps: AppTaskStep[];
	/**
	 * Outputs connected to the end node.
	 */
	outputs: AppTaskOutput[];
	/**
	 * Original task stats (queued, inProgress, etc.)
	 */
	stats: Task["steps"];
};

export type AppTaskResult = {
	task: AppTask;
};

function parseTaskResponseJson(json: unknown): AppTaskResult {
	if (typeof json !== "object" || json === null) {
		throw new Error("Invalid response JSON");
	}

	const rawTask = (json as { task?: unknown }).task;
	const taskResult = Task.safeParse(rawTask);
	if (!taskResult.success) {
		console.error(
			"Zod Parse Error (Task):",
			JSON.stringify(taskResult.error, null, 2),
		);
		throw new Error("Invalid response JSON: task parsing failed");
	}
	const task = taskResult.data;

	const rawGenerations = (json as { generations?: unknown }).generations;
	let generations: Generation[] = [];
	if (Array.isArray(rawGenerations)) {
		generations = rawGenerations
			.map((g) => {
				const res = Generation.safeParse(g);
				return res.success ? res.data : null;
			})
			.filter((g): g is Generation => g !== null);
	}

	const generationsById = Object.fromEntries(
		generations.map((g) => [g.id, g]),
	);

	const steps: AppTaskStep[] = task.sequences.map((sequence, sequenceIndex) => ({
		title: `Step ${sequenceIndex + 1}`,
		status: sequence.status,
		items: sequence.steps
			.map((step) => {
				const generation = generationsById[step.generationId];
				if (!generation) {
					return null;
				}
				const operationNode = generation.context.operationNode;
				if (!isOperationNode(operationNode)) {
					return null;
				}

				if (isCompletedGeneration(generation)) {
					return {
						id: step.id,
						title: step.name,
						status: generation.status,
						generationId: generation.id,
						outputs: generation.outputs,
					};
				}
				if (isFailedGeneration(generation)) {
					return {
						id: step.id,
						title: step.name,
						status: generation.status,
						generationId: generation.id,
						error: generation.error.message,
					};
				}
				return {
					id: step.id,
					title: step.name,
					status: generation.status,
					generationId: generation.id,
				};
			})
			.filter((item) => item !== null) as AppTaskStepItem[],
	}));

	const allStepItems = steps.flatMap((step) => step.items);
	const outputs: AppTaskOutput[] = (task.nodeIdsConnectedToEnd ?? [])
		.map((nodeId) => {
			const match = allStepItems.find((item) => {
				const generation = generationsById[item.generationId];
				if (!generation) {
					return false;
				}
				return generation.context.operationNode.id === nodeId;
			});
			if (!match) {
				return null;
			}
			const generation = generationsById[match.generationId];
			if (!generation || !isCompletedGeneration(generation)) {
				return null;
			}
			return {
				title: match.title,
				generationId: generation.id,
				outputs: generation.outputs,
			};
		})
		.filter((item) => item !== null) as AppTaskOutput[];

	// Separate original stats from the task to avoid collision with our new steps array
	const { steps: taskStats, ...taskRest } = task;

	return {
		task: {
			...taskRest,
			stats: taskStats,
			steps,
			outputs,
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
		const result = await this.#runApp(args);
		const taskId = result.id;

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
