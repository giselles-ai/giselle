import { describe, expect, test } from "vitest";
import type { TeamPlan } from "@/db/schema";
import { canCreateFreeTeam } from "./free-team-creation";

describe("canCreateFreeTeam", () => {
	test("returns true for non-internal user without existing free team", () => {
		expect(canCreateFreeTeam("user@example.com", ["pro", "team"])).toBe(true);
	});

	test("returns false for internal user (route06.co.jp)", () => {
		expect(canCreateFreeTeam("user@route06.co.jp", [])).toBe(false);
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
});
