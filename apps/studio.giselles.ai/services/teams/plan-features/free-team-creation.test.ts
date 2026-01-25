import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { TeamPlan } from "@/db/schema";
import { canCreateFreeTeam } from "./free-team-creation";

describe("canCreateFreeTeam", () => {
	const originalEnv = process.env.INTERNAL_USER_EMAIL_DOMAIN;

	beforeEach(() => {
		process.env.INTERNAL_USER_EMAIL_DOMAIN = "internal.example.com";
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.INTERNAL_USER_EMAIL_DOMAIN;
		} else {
			process.env.INTERNAL_USER_EMAIL_DOMAIN = originalEnv;
		}
	});

	test("returns true for non-internal user without existing free team", () => {
		expect(canCreateFreeTeam("user@example.com", ["pro", "team"])).toBe(true);
	});

	test("returns false for internal user", () => {
		expect(canCreateFreeTeam("user@internal.example.com", [])).toBe(false);
	});

	test("returns false for user with existing free team", () => {
		expect(canCreateFreeTeam("user@example.com", ["free"])).toBe(false);
	});

	test("returns false for user with existing free team among multiple teams", () => {
		const plans: TeamPlan[] = ["pro", "free", "team"];
		expect(canCreateFreeTeam("user@example.com", plans)).toBe(false);
	});

	test("returns true for user with no email and no free team", () => {
		expect(canCreateFreeTeam(null, ["pro"])).toBe(true);
		expect(canCreateFreeTeam(undefined, ["pro"])).toBe(true);
	});

	test("returns false for user with no email but has free team", () => {
		expect(canCreateFreeTeam(null, ["free"])).toBe(false);
	});

	test("returns true for user with no teams", () => {
		expect(canCreateFreeTeam("user@example.com", [])).toBe(true);
	});

	test("returns true for any user when INTERNAL_USER_EMAIL_DOMAIN is not set", () => {
		delete process.env.INTERNAL_USER_EMAIL_DOMAIN;
		expect(canCreateFreeTeam("user@internal.example.com", [])).toBe(true);
	});
});
