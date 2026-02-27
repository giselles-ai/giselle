import { App as AppSchema, type App as AppType } from "@giselles-ai/protocol";
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
	 * Secret key token (format: "<apiKeyId>.<secret>"). Sent as `Authorization: Bearer <token>`.
	 */
	apiKey?: string;
	/**
	 * Dependency-injected fetch implementation for tests and nonstandard runtimes.
	 */
	fetch?: typeof fetch;
};

export type AppRunInput = {
	text: string;
	file?:
		| {
				fileId: string;
		  }
		| {
				base64: string;
				name: string;
				type: string;
		  };
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

export type UploadedFileData = {
	id: string;
	name: string;
	type: string;
	size: number;
	status: "uploaded";
	uploadedAt: number;
	providerOptions?: {
		openai?: {
			fileId: string;
		};
	};
};

export type UploadFileArgs = {
	appId: string;
	file: File;
	/**
	 * Optional override for the stored file name.
	 * Defaults to `file.name`.
	 */
	fileName?: string;
};

export type UploadFileResult = {
	file: UploadedFileData;
};

export type AppListItem = AppType & {
	name: string;
};

export type AppListResult = {
	apps: AppListItem[];
};

const defaultBaseUrl = "https://studio.giselles.ai";
const defaultPollIntervalMs = 1000;
const defaultTimeoutMs = 20 * 60 * 1000;
const maxInlineFileDecodedBytes = 1024 * 1024 * 3;

function estimateDecodedBytesFromBase64(base64: string): number {
	const clean = base64.replace(/\s+/g, "");
	if (clean.length === 0) {
		return 0;
	}
	if (clean.length % 4 !== 0) {
		throw new Error("Invalid base64");
	}
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) {
		throw new Error("Invalid base64");
	}
	const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
	return (clean.length / 4) * 3 - padding;
}

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

function parseUploadFileResponseJson(json: unknown): UploadFileResult {
	if (typeof json !== "object" || json === null) {
		throw new Error("Invalid response JSON");
	}
	const file = (json as { file?: unknown }).file;
	if (typeof file !== "object" || file === null) {
		throw new Error("Invalid response JSON");
	}
	const uploaded = file as Partial<UploadedFileData>;

	if (typeof uploaded.id !== "string" || uploaded.id.length === 0) {
		throw new Error("Invalid response JSON");
	}
	if (typeof uploaded.name !== "string") {
		throw new Error("Invalid response JSON");
	}
	if (typeof uploaded.type !== "string") {
		throw new Error("Invalid response JSON");
	}
	if (typeof uploaded.size !== "number") {
		throw new Error("Invalid response JSON");
	}
	if (uploaded.status !== "uploaded") {
		throw new Error("Invalid response JSON");
	}
	if (typeof uploaded.uploadedAt !== "number") {
		throw new Error("Invalid response JSON");
	}

	return { file: uploaded as UploadedFileData };
}

function resolveAppName(source: unknown): string | undefined {
	if (typeof source !== "object" || source === null) {
		return undefined;
	}
	const record = source as Record<string, unknown>;
	const name = record.name;
	if (typeof name === "string" && name.length > 0) {
		return name;
	}
	const workspaceName = record.workspaceName;
	if (typeof workspaceName === "string" && workspaceName.length > 0) {
		return workspaceName;
	}
	const workspace = record.workspace;
	if (typeof workspace === "object" && workspace !== null) {
		const workspaceRecord = workspace as Record<string, unknown>;
		const nestedName = workspaceRecord.name;
		if (typeof nestedName === "string" && nestedName.length > 0) {
			return nestedName;
		}
	}
	return undefined;
}

function parseAppsListResponseJson(json: unknown): AppListResult {
	if (typeof json !== "object" || json === null) {
		throw new Error("Invalid response JSON");
	}
	const apps = (json as { apps?: unknown }).apps;
	if (!Array.isArray(apps)) {
		throw new Error("Invalid response JSON");
	}
	const parsedApps: AppListItem[] = [];
	for (const app of apps) {
		const appRecord =
			typeof app === "object" && app !== null
				? (app as Record<string, unknown>)
				: null;
		const appPayload = appRecord?.app ?? app;
		const parsed = AppSchema.safeParse(appPayload);
		if (!parsed.success) {
			throw new Error("Invalid response JSON");
		}
		const name =
			resolveAppName(appRecord) ?? resolveAppName(appPayload) ?? "Untitled";
		parsedApps.push({ ...parsed.data, name });
	}
	return { apps: parsedApps };
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

export type PassthroughAppTask = {
	id: string;
	workspaceId: string;
	name: string;
	steps: AppTaskStep[];
	outputs: AppTaskOutput[];
	outputType: "passthrough";
	status: string;
};

export type ObjectAppTask = {
	id: string;
	workspaceId: string;
	name: string;
	steps: AppTaskStep[];
	output: Record<string, unknown>;
	outputType: "object";
	status: string;
};

export type FinalAppTask = PassthroughAppTask | ObjectAppTask;

export type FinalAppTaskResult = {
	task: FinalAppTask;
};

export type AppTask = TaskWithStatus | FinalAppTask;

export type AppTaskResult = {
	task: AppTask;
};

function parseTaskResponseJson(json: unknown): AppTaskResult {
	if (typeof json !== "object" || json === null) {
		throw new Error("Invalid response JSON");
	}
	const task = (json as { task?: unknown }).task;
	if (typeof task !== "object" || task === null) {
		throw new Error("Invalid response JSON");
	}

	const steps = (task as { steps?: unknown }).steps;
	if (!Array.isArray(steps)) {
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

	const outputType = (task as { outputType?: unknown }).outputType;
	if (outputType === "object") {
		const output = (task as { output?: unknown }).output;
		if (
			typeof output !== "object" ||
			output === null ||
			Array.isArray(output)
		) {
			throw new Error("Invalid response JSON");
		}
		return { task: task as ObjectAppTask };
	}

	if (outputType === "passthrough") {
		const outputs = (task as { outputs?: unknown }).outputs;
		if (!Array.isArray(outputs)) {
			throw new Error("Invalid response JSON");
		}
		return { task: task as PassthroughAppTask };
	}

	throw new Error("Invalid response JSON");
}

export default class Giselle {
	readonly apps: {
		run: (args: AppRunArgs) => Promise<AppRunResult>;
		runAndWait: (args: AppRunAndWaitArgs) => Promise<FinalAppTaskResult>;
		list: () => Promise<AppListResult>;
	};
	readonly files: {
		upload: (args: UploadFileArgs) => Promise<UploadFileResult>;
	};

	readonly #fetch: typeof fetch;
	readonly #baseUrl: string;
	readonly #apiKey?: string;

	constructor(options: GiselleOptions = {}) {
		this.#fetch = options.fetch ?? fetch;
		this.#baseUrl = options.baseUrl ?? defaultBaseUrl;
		this.#apiKey = options.apiKey;

		this.apps = {
			run: (args) => this.#runApp(args),
			runAndWait: (args) => this.#runAppAndWait(args),
			list: () => this.#listApps(),
		};
		this.files = {
			upload: (args) => this.#uploadFile(args),
		};
	}

	async #runApp(args: AppRunArgs): Promise<AppRunResult> {
		if (!this.#apiKey) {
			throw new ConfigurationError("`apiKey` is required");
		}

		if (args.input.file && "base64" in args.input.file) {
			let decodedBytes: number;
			try {
				decodedBytes = estimateDecodedBytesFromBase64(args.input.file.base64);
			} catch {
				throw new UnsupportedFeatureError("Invalid base64 file payload");
			}
			if (decodedBytes > maxInlineFileDecodedBytes) {
				throw new UnsupportedFeatureError(
					"Inline file payload is too large (max 3MB)",
				);
			}
		}

		const url = joinPath(this.#baseUrl, `/api/apps/${args.appId}/run`);
		const response = await this.#fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.#apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				text: args.input.text,
				file: args.input.file,
			}),
		});

		if (!response.ok) {
			const responseText = await readResponseText(response);
			throw new ApiError(
				`Runs API request failed: ${response.status} ${response.statusText}`,
				response.status,
				responseText,
			);
		}

		const responseText = await readResponseText(response);
		let json: unknown;
		try {
			json = JSON.parse(responseText);
		} catch {
			throw new ApiError(
				"Runs API returned invalid JSON",
				response.status,
				responseText,
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

	async #uploadFile(args: UploadFileArgs): Promise<UploadFileResult> {
		if (!this.#apiKey) {
			throw new ConfigurationError("`apiKey` is required");
		}

		const url = joinPath(this.#baseUrl, `/api/apps/${args.appId}/files/upload`);
		const formData = new FormData();
		formData.append("file", args.file);
		if (args.fileName !== undefined) {
			formData.append("fileName", args.fileName);
		}

		const response = await this.#fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.#apiKey}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const responseText = await readResponseText(response);
			throw new ApiError(
				`Files API request failed: ${response.status} ${response.statusText}`,
				response.status,
				responseText,
			);
		}

		const responseText = await readResponseText(response);
		let json: unknown;
		try {
			json = JSON.parse(responseText);
		} catch {
			throw new ApiError(
				"Files API returned invalid JSON",
				response.status,
				responseText,
			);
		}

		try {
			return parseUploadFileResponseJson(json);
		} catch (e) {
			throw new ApiError(
				e instanceof Error ? e.message : "Files API returned invalid JSON",
				response.status,
				"",
			);
		}
	}

	async #listApps(): Promise<AppListResult> {
		if (!this.#apiKey) {
			throw new ConfigurationError("`apiKey` is required");
		}

		const url = joinPath(this.#baseUrl, "/api/apps");
		const response = await this.#fetch(url, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.#apiKey}`,
			},
		});

		if (!response.ok) {
			const responseText = await readResponseText(response);
			throw new ApiError(
				`Apps API request failed: ${response.status} ${response.statusText}`,
				response.status,
				responseText,
			);
		}

		const responseText = await readResponseText(response);
		let json: unknown;
		try {
			json = JSON.parse(responseText);
		} catch {
			throw new ApiError(
				"Apps API returned invalid JSON",
				response.status,
				responseText,
			);
		}

		try {
			return parseAppsListResponseJson(json);
		} catch (e) {
			throw new ApiError(
				e instanceof Error ? e.message : "Apps API returned invalid JSON",
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

		const responseText = await readResponseText(response);
		let json: unknown;
		try {
			json = JSON.parse(responseText);
		} catch {
			throw new ApiError(
				"Tasks API returned invalid JSON",
				response.status,
				responseText,
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

	async #runAppAndWait(
		args: AppRunAndWaitArgs,
	): Promise<FinalAppTaskResult> {
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
		return (await this.#getTask({
			appId: args.appId,
			taskId,
			includeGenerations: true,
		})) as FinalAppTaskResult;
	}
}
