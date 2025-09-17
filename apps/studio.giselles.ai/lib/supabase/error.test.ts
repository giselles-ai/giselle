import { describe, expect, it } from "vitest";
import { createAuthError } from "./error";

function buildSupabaseAuthErrorLike(params: {
	message: string;
	name: string;
	status?: number | string;
	code?: string;
}) {
	const baseError = new Error(params.message);
	baseError.name = params.name;
	return Object.assign(baseError, {
		status: params.status,
		code: params.code,
		__isAuthError: true,
	});
}

describe("createAuthError", () => {
	it("returns the original message for handled Auth API errors", () => {
		const error = buildSupabaseAuthErrorLike({
			message: "Invalid login credentials",
			name: "AuthApiError",
			status: 400,
			code: "invalid_grant",
		});

		const result = createAuthError(error);

		expect(result).toStrictEqual({
			code: "invalid_grant",
			message: "Invalid login credentials",
			name: "AuthApiError",
			status: 400,
		});
	});

	it("masks unexpected service responses with a friendly message", () => {
		const error = buildSupabaseAuthErrorLike({
			message: "Unexpected token '<', \"<!DOCTYPE html\"... is not valid JSON",
			name: "AuthUnknownError",
		});

		const result = createAuthError(error);

		expect(result.name).toBe("AuthServiceUnavailableError");
		expect(result.status).toBe(503);
		expect(result.message).toBe(
			"Authentication service is temporarily unavailable. Please try again shortly.",
		);
	});

	it("normalizes string status values", () => {
		const error = buildSupabaseAuthErrorLike({
			message: "Unexpected token '<', \"<!DOCTYPE html\"... is not valid JSON",
			name: "AuthUnknownError",
			status: "502",
		});

		const result = createAuthError(error);

		expect(result.status).toBe(502);
	});

	it("preserves custom message for non-Supabase errors", () => {
		const unexpected = new Error("Something went wrong");

		const result = createAuthError(unexpected);

		expect(result).toStrictEqual({
			code: "unknown_error",
			message: "Something went wrong",
			name: "Error",
			status: undefined,
		});
	});
});
