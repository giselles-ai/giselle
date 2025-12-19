import type { $ZodIssue } from "@zod/core";

const base62 =
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" as const;

function generateAppParameterId() {
	// appprm is an abbreviation for APP PaRaMeter
	// Protocol expects: /^appprm-[0-9A-Za-z]{16}$/
	const bytes = new Uint8Array(16);
	// Node (>=18) provides Web Crypto; fallback is fine because this is only a best-effort data mod.
	globalThis.crypto?.getRandomValues?.(bytes);

	let suffix = "";
	for (let i = 0; i < 16; i++) {
		suffix += base62[bytes[i] % base62.length];
	}
	return `appprm-${suffix}`;
}

function isTargetIssue(issue: $ZodIssue) {
	const anyIssue = issue as unknown as {
		code?: string;
		format?: string;
		pattern?: string;
		message?: string;
		path?: unknown[];
	};

	if (!Array.isArray(anyIssue.path)) return false;
	// Expected path: ["content","draftApp","parameters",0,"id"]
	const path = anyIssue.path;
	const isDraftAppParameterId =
		path.length === 5 &&
		path[0] === "content" &&
		path[1] === "draftApp" &&
		path[2] === "parameters" &&
		typeof path[3] === "number" &&
		path[4] === "id";

	if (!isDraftAppParameterId) return false;

	const pattern = anyIssue.pattern ?? "";
	const message = anyIssue.message ?? "";
	return (
		anyIssue.code === "invalid_format" &&
		anyIssue.format === "regex" &&
		(pattern.includes("appprm-") || message.includes("appprm-"))
	);
}

export function fixInvalidAppParameterId(data: unknown, issue: $ZodIssue) {
	if (!isTargetIssue(issue)) {
		return data;
	}
	if (data == null || typeof data !== "object") {
		return data;
	}

	const anyIssue = issue as unknown as {
		path: [string, string, string, number, string];
	};
	const parameterIndex = anyIssue.path[3];

	const clone = structuredClone(data) as {
		content?: {
			draftApp?: {
				parameters?: Array<{ id?: unknown }>;
			};
		};
	};

	const parameters = clone.content?.draftApp?.parameters;
	if (!Array.isArray(parameters)) {
		return data;
	}
	const parameter = parameters[parameterIndex];
	if (!parameter || typeof parameter !== "object") {
		return data;
	}

	parameter.id = generateAppParameterId();
	return clone;
}
