import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { isInternalUserEmail } from "./utils";

describe("isInternalUserEmail", () => {
	const originalEnv = process.env.INTERNAL_USER_EMAIL_DOMAIN;

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.INTERNAL_USER_EMAIL_DOMAIN;
		} else {
			process.env.INTERNAL_USER_EMAIL_DOMAIN = originalEnv;
		}
	});

	describe("when INTERNAL_USER_EMAIL_DOMAIN is set", () => {
		beforeEach(() => {
			process.env.INTERNAL_USER_EMAIL_DOMAIN = "example.com";
		});

		test("returns true for email matching the domain exactly", () => {
			expect(isInternalUserEmail("user@example.com")).toBe(true);
		});

		test("returns true for email with subdomain ending with the configured domain", () => {
			expect(isInternalUserEmail("user@sub.example.com")).toBe(true);
		});

		test("returns false for email with different domain", () => {
			expect(isInternalUserEmail("user@other.com")).toBe(false);
		});

		test("returns false for email with domain that contains but does not end with configured domain", () => {
			expect(isInternalUserEmail("user@example.com.fake")).toBe(false);
		});

		test("returns false for email without @ symbol", () => {
			expect(isInternalUserEmail("invalid-email")).toBe(false);
		});

		test("returns false for empty string", () => {
			expect(isInternalUserEmail("")).toBe(false);
		});
	});

	describe("when INTERNAL_USER_EMAIL_DOMAIN is not set", () => {
		beforeEach(() => {
			delete process.env.INTERNAL_USER_EMAIL_DOMAIN;
		});

		test("returns false for any email", () => {
			expect(isInternalUserEmail("user@example.com")).toBe(false);
			expect(isInternalUserEmail("admin@internal.corp")).toBe(false);
		});
	});

	describe("when INTERNAL_USER_EMAIL_DOMAIN is empty string", () => {
		beforeEach(() => {
			process.env.INTERNAL_USER_EMAIL_DOMAIN = "";
		});

		test("returns false for any email", () => {
			expect(isInternalUserEmail("user@example.com")).toBe(false);
		});
	});
});
