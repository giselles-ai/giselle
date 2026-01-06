import {
	ApiError,
	ConfigurationError,
	NotImplementedError,
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
	 * Poll interval for status checks. Not used until the status API exists.
	 */
	pollIntervalMs?: number;
};

const defaultBaseUrl = "https://studio.giselles.ai";

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

export default class Giselle {
	readonly app: {
		run: (args: AppRunArgs) => Promise<AppRunResult>;
		runAndWait: (args: AppRunAndWaitArgs) => Promise<unknown>;
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

	#runAppAndWait(_args: AppRunAndWaitArgs): Promise<unknown> {
		return Promise.reject(
			new NotImplementedError(
				"`runAndWait` is not available yet because the public task status/results API is not implemented. Use `app.run()` for now.",
			),
		);
	}
}
