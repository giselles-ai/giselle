import { isAuthError } from "@supabase/auth-js";
import type { AuthError as SupabaseAuthError } from "@supabase/supabase-js";

type SupabaseAuthErrorShape = Pick<
	SupabaseAuthError,
	"name" | "status" | "code" | "message"
>;

export type AuthError = SupabaseAuthErrorShape;

type SupabaseAuthErrorLike = SupabaseAuthErrorShape & {
	__isAuthError?: boolean;
};

const AUTH_SERVICE_UNAVAILABLE_MESSAGE =
	"Authentication service is temporarily unavailable. Please try again shortly.";

const GENERIC_AUTH_ERROR_MESSAGE =
	"We could not complete your request. Please try again.";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isSupabaseAuthErrorLike(
	value: unknown,
): value is SupabaseAuthErrorLike {
	if (isAuthError(value)) {
		return true;
	}

	if (!isRecord(value)) {
		return false;
	}

	const message = value.message;
	const name = value.name;
	if (typeof message !== "string" || typeof name !== "string") {
		return false;
	}

	if (!("status" in value || "code" in value)) {
		return false;
	}

	const status = value.status;
	const statusValid =
		status === undefined ||
		typeof status === "number" ||
		typeof status === "string";
	if (!statusValid) {
		return false;
	}

	const code = value.code;
	const codeValid = code === undefined || typeof code === "string";
	return codeValid;
}

function normalizeStatus(status?: number | string): number | undefined {
	if (typeof status === "number") {
		return status;
	}
	if (typeof status === "string") {
		const numericStatus = Number(status);
		if (Number.isFinite(numericStatus)) {
			return numericStatus;
		}
	}
	return undefined;
}

function isHtmlResponseParseFailure(message: string): boolean {
	const normalizedMessage = message.toLowerCase();
	const isUnexpectedToken = normalizedMessage.includes("unexpected token");
	const hintsHtmlMarkup = normalizedMessage.includes("<");
	const mentionsInvalidJson = normalizedMessage.includes("not valid json");
	return isUnexpectedToken && hintsHtmlMarkup && mentionsInvalidJson;
}

function shouldMaskServiceUnavailability(
	error: SupabaseAuthErrorLike,
): boolean {
	const status = normalizeStatus(error.status);
	if (typeof status === "number" && status >= 500) {
		return true;
	}

	const code = error.code;
	if (typeof code === "string" && code.toLowerCase() === "unexpected_error") {
		return true;
	}

	return isHtmlResponseParseFailure(error.message);
}

export function createAuthError(error: unknown): AuthError {
	if (isSupabaseAuthErrorLike(error)) {
		if (shouldMaskServiceUnavailability(error)) {
			return {
				code: error.code ?? "auth_service_unavailable",
				message: AUTH_SERVICE_UNAVAILABLE_MESSAGE,
				name: "AuthServiceUnavailableError",
				status: normalizeStatus(error.status) ?? 503,
			};
		}

		return {
			code: error.code,
			message: error.message,
			name: error.name,
			status: normalizeStatus(error.status),
		};
	}

	if (error instanceof Error) {
		return {
			code: "unknown_error",
			message: error.message || GENERIC_AUTH_ERROR_MESSAGE,
			name: error.name,
			status: undefined,
		};
	}

	return {
		code: "unknown_error",
		message: GENERIC_AUTH_ERROR_MESSAGE,
		name: "UnknownError",
		status: undefined,
	};
}
