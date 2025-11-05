import { describe, expect, test } from "vitest";
import { ManualFlowTrigger } from "./manual";

describe("ManualFlowTrigger", () => {
	test("can parse object does not have staged", () => {
		const manualFlowTriggerLike = {
			provider: "manual",
			event: {
				id: "manual",
				parameters: [],
			},
		};
		const parse = ManualFlowTrigger.safeParse(manualFlowTriggerLike);
		expect(parse.success).toBe(true);
		expect(parse.data?.staged).toBe(false);
	});
});
