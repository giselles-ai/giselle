import type { Task } from "@giselles-ai/protocol";
import { describe, expect, it } from "vitest";
import { patchTask } from "./patch-object";

describe("patchTask", () => {
	// Helper function to create a minimal Task object for testing
	function createTestTask(): Task {
		return {
			id: "tsk-test123" as const,
			workspaceId: "wrks-test456" as const,
			starter: { type: "run-button" },
			name: "test",
			status: "inProgress",
			steps: {
				queued: 0,
				inProgress: 1,
				completed: 0,
				warning: 0,
				cancelled: 0,
				failed: 0,
			},
			trigger: "manual",
			duration: {
				wallClock: 100,
				totalTask: 50,
			},
			usage: {
				inputTokens: 10,
				outputTokens: 20,
				totalTokens: 30,
			},
			createdAt: Date.now(),
			updatedAt: Date.now(),
			annotations: [],
			sequences: [
				{
					id: "sqn-001" as const,
					status: "queued",
					duration: {
						wallClock: 0,
						totalTask: 0,
					},
					usage: {
						inputTokens: 0,
						outputTokens: 0,
						totalTokens: 0,
					},
					steps: [
						{
							id: "stp-001" as const,
							status: "queued",
							name: "Step 1",
							generationId: "gnr-001" as const,
							duration: 0,
							usage: {
								inputTokens: 0,
								outputTokens: 0,
								totalTokens: 0,
							},
						},
						{
							id: "stp-002" as const,
							status: "running",
							name: "Step 2",
							generationId: "gnr-002" as const,
							duration: 0,
							usage: {
								inputTokens: 0,
								outputTokens: 0,
								totalTokens: 0,
							},
						},
						{
							id: "stp-003" as const,
							status: "queued",
							name: "Step 3",
							generationId: "gnr-003" as const,
							duration: 0,
							usage: {
								inputTokens: 0,
								outputTokens: 0,
								totalTokens: 0,
							},
						},
					],
				},
				{
					id: "sqn-002" as const,
					status: "queued",
					duration: {
						wallClock: 0,
						totalTask: 0,
					},
					usage: {
						inputTokens: 0,
						outputTokens: 0,
						totalTokens: 0,
					},
					steps: [],
				},
			],
		};
	}

	describe("string patching", () => {
		it("should update status field", () => {
			const task = createTestTask();
			const result = patchTask(task, { path: "status", set: "completed" });

			expect(result.status).toBe("completed");
			expect(task.status).toBe("inProgress"); // Original should be unchanged
		});

		it("should update trigger field", () => {
			const task = createTestTask();
			const result = patchTask(task, { path: "trigger", set: "github" });

			expect(result.trigger).toBe("github");
		});
	});

	describe("number patching", () => {
		it("should set number value", () => {
			const task = createTestTask();
			const result = patchTask(task, { path: "steps.queued", set: 5 });

			expect(result.steps.queued).toBe(5);
		});

		it("should increment number value", () => {
			const task = createTestTask();
			const result = patchTask(task, {
				path: "steps.completed",
				increment: 3,
			});

			expect(result.steps.completed).toBe(3);
		});

		it("should decrement number value", () => {
			const task = createTestTask();
			const result = patchTask(task, {
				path: "steps.inProgress",
				decrement: 1,
			});

			expect(result.steps.inProgress).toBe(0);
		});
	});

	describe("array patching", () => {
		it("should push to annotations array", () => {
			const task = createTestTask();
			const result = patchTask(task, {
				path: "annotations",
				push: [
					{
						level: "info",
						message: "Test annotation",
						sequenceId: "sqn-001" as const,
						stepId: "stp-001" as const,
					},
					{
						level: "warning",
						message: "Another annotation",
						sequenceId: "sqn-001" as const,
						stepId: "stp-002" as const,
					},
				],
			});

			expect(result.annotations).toHaveLength(2);
			expect(result.annotations[0]).toEqual({
				level: "info",
				message: "Test annotation",
				sequenceId: "sqn-001",
				stepId: "stp-001",
			});
		});

		it("should set entire array", () => {
			const task = createTestTask();
			const result = patchTask(task, {
				path: "annotations",
				set: [
					{
						level: "error",
						message: "Error occurred",
						sequenceId: "sqn-001" as const,
						stepId: "stp-001" as const,
					},
				],
			});

			expect(result.annotations).toHaveLength(1);
			expect(result.annotations[0].level).toBe("error");
		});
	});

	describe("array index patching", () => {
		it("should support both dot and bracket notation", () => {
			const task = createTestTask();

			// Test bracket notation still works
			const result1 = patchTask(task, {
				path: "sequences[0].steps[1].status",
				set: "completed",
			});
			expect(result1.sequences[0].steps[1].status).toBe("completed");

			// Test dot notation works
			const result2 = patchTask(task, {
				path: "sequences.0.steps.1.status",
				set: "completed",
			});
			expect(result2.sequences[0].steps[1].status).toBe("completed");
		});

		it("should update sequence status using array index", () => {
			const task = createTestTask();
			const result = patchTask(task, {
				path: "sequences.0.status",
				set: "completed",
			});

			expect(result.sequences[0].status).toBe("completed");
			expect(result.sequences[1].status).toBe("queued");
		});

		it("should update nested step status using array indices", () => {
			const task = createTestTask();
			const result = patchTask(task, {
				path: "sequences.0.steps.1.status",
				set: "completed",
			});

			expect(result.sequences[0].steps[1].status).toBe("completed");
			expect(result.sequences[0].steps[0].status).toBe("queued");
			expect(result.sequences[0].steps[2].status).toBe("queued");
		});

		it("should update step name using array indices", () => {
			const task = createTestTask();
			const result = patchTask(task, {
				path: "sequences.0.steps.2.name",
				set: "Updated Step 3",
			});

			expect(result.sequences[0].steps[2].name).toBe("Updated Step 3");
		});
	});

	describe("multiple patches", () => {
		it("should apply multiple patches in one call", () => {
			const task = createTestTask();
			const result = patchTask(
				task,
				{ path: "status", set: "completed" },
				{ path: "steps.completed", increment: 2 },
				{ path: "steps.inProgress", decrement: 1 },
				{ path: "sequences.0.status", set: "running" },
			);

			expect(result.status).toBe("completed");
			expect(result.steps.completed).toBe(2);
			expect(result.steps.inProgress).toBe(0);
			expect(result.sequences[0].status).toBe("running");
		});

		it("should handle complex nested patches", () => {
			const task = createTestTask();
			const result = patchTask(
				task,
				{ path: "duration.wallClock", increment: 50 },
				{ path: "duration.totalTask", set: 75 },
				{ path: "usage.totalTokens", decrement: 5 },
			);

			expect(result.duration.wallClock).toBe(150);
			expect(result.duration.totalTask).toBe(75);
			expect(result.usage.totalTokens).toBe(25);
		});
	});

	describe("dynamic paths", () => {
		it("should handle dynamic array indices", () => {
			const task = createTestTask();
			const sequenceIndex = 0;
			const stepIndex = 1;

			const result = patchTask(
				task,
				{ path: "steps.inProgress", increment: 2 },
				{ path: "steps.queued", decrement: 2 },
				{ path: `sequences.${sequenceIndex}.status`, set: "running" },
				{
					path: `sequences.${sequenceIndex}.steps.${stepIndex}.status`,
					set: "completed",
				},
			);

			expect(result.steps.inProgress).toBe(3);
			expect(result.steps.queued).toBe(-2);
			expect(result.sequences[0].status).toBe("running");
			expect(result.sequences[0].steps[1].status).toBe("completed");
		});

		it("should handle computed paths", () => {
			const task = createTestTask();
			const patches = [0, 1, 2].map((idx) => ({
				path: `sequences.0.steps.${idx}.status`,
				set: "completed" as const,
			}));

			const result = patchTask(task, ...patches);

			expect(result.sequences[0].steps[0].status).toBe("completed");
			expect(result.sequences[0].steps[1].status).toBe("completed");
			expect(result.sequences[0].steps[2].status).toBe("completed");
		});
	});

	describe("edge cases", () => {
		it("should handle empty patches", () => {
			const task = createTestTask();
			const result = patchTask(task);

			expect(result).toEqual(task);
			expect(result).not.toBe(task); // Should be a clone
		});

		it("should throw error for invalid path", () => {
			const task = createTestTask();
			expect(() => {
				patchTask(task, { path: "", set: "value" });
			}).toThrow('Invalid path: ""');
		});

		it("should throw error for non-existent path", () => {
			const task = createTestTask();
			expect(() => {
				patchTask(task, { path: "nonexistent.field", set: "value" });
			}).toThrow('Path not found: "nonexistent.field"');
		});

		it("should throw error when incrementing non-number", () => {
			const task = createTestTask();
			expect(() => {
				patchTask(task, { path: "status", increment: 1 });
			}).toThrow('Cannot increment non-number at path: "status"');
		});

		it("should throw error when pushing to non-array", () => {
			const task = createTestTask();
			expect(() => {
				patchTask(task, { path: "status", push: ["item"] });
			}).toThrow('Cannot push to non-array at path: "status"');
		});

		it("should throw error for prototype pollution attempts", () => {
			const task = createTestTask();

			// Test __proto__ pollution
			expect(() => {
				patchTask(task, { path: "__proto__.polluted", set: "bad" });
			}).toThrow('Dangerous path detected: "__proto__.polluted"');

			// Test constructor pollution
			expect(() => {
				patchTask(task, { path: "constructor.prototype.polluted", set: "bad" });
			}).toThrow('Dangerous path detected: "constructor.prototype.polluted"');

			// Test prototype pollution
			expect(() => {
				patchTask(task, { path: "sequences.prototype.polluted", set: "bad" });
			}).toThrow('Dangerous path detected: "sequences.prototype.polluted"');

			// Test nested dangerous key
			expect(() => {
				patchTask(task, { path: "sequences.0.__proto__", set: "bad" });
			}).toThrow('Dangerous path detected: "sequences.0.__proto__"');

			// Test dangerous keys with other operations
			expect(() => {
				patchTask(task, { path: "constructor", increment: 1 });
			}).toThrow('Dangerous path detected: "constructor"');

			expect(() => {
				patchTask(task, { path: "__proto__", decrement: 1 });
			}).toThrow('Dangerous path detected: "__proto__"');

			expect(() => {
				patchTask(task, { path: "prototype", push: ["item"] });
			}).toThrow('Dangerous path detected: "prototype"');
		});

		it("should allow legitimate paths that might look suspicious", () => {
			const task = createTestTask();

			// These should work fine
			const result1 = patchTask(task, { path: "status", set: "completed" });
			expect(result1.status).toBe("completed");

			const result2 = patchTask(task, {
				path: "sequences.0.status",
				set: "running",
			});
			expect(result2.sequences[0].status).toBe("running");

			// Property names containing the word "proto" should be fine
			const result3 = patchTask(task, {
				path: "trigger",
				set: "protocol_handler",
			});
			expect(result3.trigger).toBe("protocol_handler");
		});
	});

	describe("immutability", () => {
		it("should maintain immutability", () => {
			const task = createTestTask();
			const original = structuredClone(task);

			patchTask(
				task,
				{ path: "status", set: "completed" },
				{ path: "steps.completed", increment: 5 },
				{ path: "sequences.0.status", set: "completed" },
			);

			expect(task).toEqual(original); // Original should remain unchanged
		});
	});
});
