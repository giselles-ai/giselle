import { describe, expect, it } from "vitest";
import { triggers } from "./index";

describe("triggers", () => {
	it("should have unique ids", () => {
		const ids = triggers.map((trigger) => trigger.event.id);
		const uniqueIds = new Set(ids);

		// Print duplicates if any for easier debugging
		const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
		if (duplicates.length > 0) {
			console.error("Duplicate trigger ids found:", duplicates);
		}

		expect(uniqueIds.size).toBe(ids.length);
	});
});
