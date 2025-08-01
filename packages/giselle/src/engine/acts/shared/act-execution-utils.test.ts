import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Act, Sequence, Step } from "../../../concepts/act";
import { patchAct } from "../object/patch-object";
import {
	createStepCountPatches,
	executeAct,
	isValidActTransition,
	isValidGenerationTransition,
} from "./act-execution-utils";

// Test data factory functions
function createTestStep(overrides?: Partial<Step>): Step {
	return {
		id: "stp-1" as const,
		status: "created",
		name: "Test Step",
		generationId: "gnr-1" as const,
		duration: 0,
		usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
		...overrides,
	};
}

function createTestSequence(overrides?: Partial<Sequence>): Sequence {
	return {
		id: "sqn-1" as const,
		status: "created",
		duration: { wallClock: 0, totalTask: 0 },
		usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
		steps: [createTestStep()],
		...overrides,
	};
}

function createTestAct(overrides?: Partial<Act>): Act {
	const sequences = overrides?.sequences || [createTestSequence()];
	const totalSteps = sequences.reduce((sum, seq) => sum + seq.steps.length, 0);

	return {
		id: "act-1" as const,
		workspaceId: "wrks-1" as const,
		name: "Test Act",
		status: "inProgress",
		steps: {
			queued: totalSteps,
			inProgress: 0,
			completed: 0,
			warning: 0,
			cancelled: 0,
			failed: 0,
		},
		trigger: "manual",
		duration: { wallClock: 0, totalTask: 0 },
		usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
		createdAt: 0,
		updatedAt: 0,
		annotations: [],
		sequences,
		...overrides,
	};
}

describe("executeAct", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("executes a simple act with one sequence and two steps", async () => {
		let currentAct = createTestAct({
			sequences: [
				createTestSequence({
					steps: [
						createTestStep({
							id: "stp-1" as const,
							generationId: "gnr-1" as const,
						}),
						createTestStep({
							id: "stp-2" as const,
							generationId: "gnr-2" as const,
						}),
					],
				}),
			],
		});

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const startGeneration = vi.fn(async (_id: string, callbacks?) => {
			await vi.advanceTimersByTimeAsync(100);
			await callbacks?.onCompleted?.();
		});

		await executeAct({ act: currentAct, applyPatches, startGeneration });

		// Verify final state
		expect(currentAct.status).toBe("completed");
		expect(currentAct.steps.queued).toBe(0);
		expect(currentAct.steps.completed).toBe(2);

		expect(currentAct.sequences[0].status).toBe("completed");
		expect(currentAct.sequences[0].steps[0].status).toBe("completed");
		expect(currentAct.sequences[0].steps[1].status).toBe("completed");

		// Verify timing
		expect(currentAct.duration.wallClock).toBeGreaterThan(0);
		// Total task duration includes the wall clock time of the sequence
		expect(currentAct.duration.totalTask).toBeGreaterThan(200);

		// Verify generation calls
		expect(startGeneration).toHaveBeenCalledTimes(2);
		expect(startGeneration).toHaveBeenCalledWith("gnr-1", expect.any(Object));
		expect(startGeneration).toHaveBeenCalledWith("gnr-2", expect.any(Object));
	});

	it("executes multiple sequences sequentially", async () => {
		let currentAct = createTestAct({
			sequences: [
				createTestSequence({
					id: "sqn-1" as const,
					steps: [createTestStep({ generationId: "gnr-1" as const })],
				}),
				createTestSequence({
					id: "sqn-2" as const,
					steps: [createTestStep({ generationId: "gnr-2" as const })],
				}),
			],
		});

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const startGeneration = vi.fn(async (_id: string, callbacks?) => {
			await vi.advanceTimersByTimeAsync(100);
			await callbacks?.onCompleted?.();
		});

		const sequenceStartOrder: string[] = [];
		const onSequenceStart = vi.fn((seq: Sequence) => {
			sequenceStartOrder.push(seq.id);
		});

		await executeAct({
			act: currentAct,
			applyPatches,
			startGeneration,
			onSequenceStart,
		});

		// Verify sequences executed in order
		expect(sequenceStartOrder).toEqual(["sqn-1", "sqn-2"]);
		expect(currentAct.status).toBe("completed");
		expect(currentAct.sequences[0].status).toBe("completed");
		expect(currentAct.sequences[1].status).toBe("completed");
	});

	it("handles step failure within a sequence", async () => {
		let currentAct = createTestAct({
			sequences: [
				createTestSequence({
					steps: [
						createTestStep({
							id: "stp-1" as const,
							generationId: "gnr-1" as const,
						}),
						createTestStep({
							id: "stp-2" as const,
							generationId: "gnr-2" as const,
						}),
					],
				}),
			],
		});

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const _testError = new Error("Step failed");
		const startGeneration = vi.fn(async (id: string, callbacks?) => {
			await vi.advanceTimersByTimeAsync(100);
			if (id === "gnr-2") {
				// Create a minimal failed generation object for testing
				// Using a type assertion for test purposes
				await callbacks?.onFailed?.({
					id: id as `gnr-${string}`,
					status: "failed",
					origin: { type: "test" },
				} as never);
			} else {
				await callbacks?.onCompleted?.();
			}
		});

		const onStepError = vi.fn();

		await executeAct({
			act: currentAct,
			applyPatches,
			startGeneration,
			onStepError,
		});

		// Verify act failed
		expect(currentAct.status).toBe("failed");
		expect(currentAct.steps.completed).toBe(1);
		expect(currentAct.steps.failed).toBe(1);

		// Verify sequence failed
		expect(currentAct.sequences[0].status).toBe("failed");
		expect(currentAct.sequences[0].steps[0].status).toBe("completed");
		expect(currentAct.sequences[0].steps[1].status).toBe("failed");

		// Verify error annotation was added
		expect(currentAct.annotations).toHaveLength(1);
		expect(currentAct.annotations[0]).toMatchObject({
			level: "error",
			stepId: "stp-2",
			sequenceId: "sqn-1",
		});
	});

	it("cancels remaining sequences when a sequence fails", async () => {
		let currentAct = createTestAct({
			sequences: [
				createTestSequence({
					id: "sqn-1" as const,
					steps: [createTestStep({ generationId: "gnr-1" as const })],
				}),
				createTestSequence({
					id: "sqn-2" as const,
					steps: [createTestStep({ generationId: "gnr-2" as const })],
				}),
				createTestSequence({
					id: "sqn-3" as const,
					steps: [createTestStep({ generationId: "gnr-3" as const })],
				}),
			],
		});

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const startGeneration = vi.fn(async (id: string, callbacks?) => {
			if (id === "gnr-1") {
				throw new Error("Generation failed");
			}
			await callbacks?.onCompleted?.();
		});

		const onSequenceSkip = vi.fn();

		// Verify initial state
		expect(currentAct.steps.queued).toBe(3);
		expect(currentAct.steps.inProgress).toBe(0);

		await executeAct({
			act: currentAct,
			applyPatches,
			startGeneration,
			onSequenceSkip,
		});

		// Verify act failed
		expect(currentAct.status).toBe("failed");

		// Verify first sequence failed
		expect(currentAct.sequences[0].status).toBe("failed");

		// Verify remaining sequences were skipped
		expect(onSequenceSkip).toHaveBeenCalledTimes(2);
		expect(onSequenceSkip).toHaveBeenCalledWith(currentAct.sequences[1], 1);
		expect(onSequenceSkip).toHaveBeenCalledWith(currentAct.sequences[2], 2);

		// Verify step counts - implementation is now fixed
		expect(currentAct.steps.failed).toBe(1);
		expect(currentAct.steps.cancelled).toBe(2); // Both remaining sequences' steps are cancelled
		expect(currentAct.steps.queued).toBe(0); // No steps remain queued
	});

	it("should cancel ALL remaining sequence steps when a sequence fails", async () => {
		let currentAct = createTestAct({
			sequences: [
				createTestSequence({
					id: "sqn-1" as const,
					steps: [createTestStep({ generationId: "gnr-1" as const })],
				}),
				createTestSequence({
					id: "sqn-2" as const,
					steps: [
						createTestStep({
							id: "stp-2a" as const,
							generationId: "gnr-2a" as const,
						}),
						createTestStep({
							id: "stp-2b" as const,
							generationId: "gnr-2b" as const,
						}),
					],
				}),
				createTestSequence({
					id: "sqn-3" as const,
					steps: [
						createTestStep({
							id: "stp-3a" as const,
							generationId: "gnr-3a" as const,
						}),
						createTestStep({
							id: "stp-3b" as const,
							generationId: "gnr-3b" as const,
						}),
						createTestStep({
							id: "stp-3c" as const,
							generationId: "gnr-3c" as const,
						}),
					],
				}),
			],
		});

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const startGeneration = vi.fn(async (id: string, callbacks?) => {
			if (id === "gnr-1") {
				throw new Error("Generation failed");
			}
			await callbacks?.onCompleted?.();
		});

		const onSequenceSkip = vi.fn();

		// Verify initial state
		expect(currentAct.steps.queued).toBe(6); // 1 + 2 + 3 steps
		expect(currentAct.steps.inProgress).toBe(0);

		await executeAct({
			act: currentAct,
			applyPatches,
			startGeneration,
			onSequenceSkip,
		});

		// Verify act failed
		expect(currentAct.status).toBe("failed");

		// Verify first sequence failed
		expect(currentAct.sequences[0].status).toBe("failed");

		// Verify remaining sequences were skipped
		expect(onSequenceSkip).toHaveBeenCalledTimes(2);

		// Expected behavior: ALL remaining steps should be cancelled
		expect(currentAct.steps.failed).toBe(1); // Only the failed step
		expect(currentAct.steps.cancelled).toBe(5); // All 5 remaining steps should be cancelled
		expect(currentAct.steps.queued).toBe(0); // No steps should remain queued
	});

	it("executes steps in parallel within a sequence", async () => {
		let currentAct = createTestAct({
			sequences: [
				createTestSequence({
					steps: [
						createTestStep({
							id: "stp-1" as const,
							generationId: "gnr-1" as const,
						}),
						createTestStep({
							id: "stp-2" as const,
							generationId: "gnr-2" as const,
						}),
						createTestStep({
							id: "stp-3" as const,
							generationId: "gnr-3" as const,
						}),
					],
				}),
			],
		});

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const executionOrder: string[] = [];
		const startGeneration = vi.fn(async (id: string, callbacks?) => {
			executionOrder.push(`start-${id}`);
			// Simple simulation with consistent timing
			await vi.advanceTimersByTimeAsync(100);
			executionOrder.push(`end-${id}`);
			await callbacks?.onCompleted?.();
		});

		await executeAct({ act: currentAct, applyPatches, startGeneration });

		// Verify all steps started before any completed (shows parallel execution)
		const startCount = executionOrder.filter((e) =>
			e.startsWith("start-"),
		).length;
		const firstEndIndex = executionOrder.findIndex((e) => e.startsWith("end-"));
		expect(startCount).toBe(3);
		expect(firstEndIndex).toBeGreaterThanOrEqual(3); // All starts before first end

		// Verify all steps completed
		expect(executionOrder.filter((e) => e.startsWith("end-")).length).toBe(3);

		// Verify timing - total task duration is sum of all steps
		// This is by design: totalTask is the sum of all individual task durations
		// With the fake timer advancing logic, each step adds its duration
		expect(currentAct.duration.totalTask).toBeGreaterThanOrEqual(300);

		// Wall clock should be less since steps run in parallel
		// But with our simple timer setup, it might be close to the sum
		expect(currentAct.duration.wallClock).toBeGreaterThan(0);
		expect(currentAct.sequences[0].duration.wallClock).toBeGreaterThan(0);
	});

	it("invokes all callbacks in correct order", async () => {
		let currentAct = createTestAct({
			sequences: [
				createTestSequence({
					steps: [createTestStep({ generationId: "gnr-1" as const })],
				}),
			],
		});

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const startGeneration = vi.fn(async (_id: string, callbacks?) => {
			await callbacks?.onCompleted?.();
		});

		const callOrder: string[] = [];
		const callbacks = {
			onActStart: vi.fn(() => {
				callOrder.push("act-start");
			}),
			onSequenceStart: vi.fn(() => {
				callOrder.push("sequence-start");
			}),
			onStepStart: vi.fn(() => {
				callOrder.push("step-start");
			}),
			onStepComplete: vi.fn(() => {
				callOrder.push("step-complete");
			}),
			onSequenceComplete: vi.fn(() => {
				callOrder.push("sequence-complete");
			}),
			onActComplete: vi.fn(() => {
				callOrder.push("act-complete");
			}),
		};

		await executeAct({
			act: currentAct,
			applyPatches,
			startGeneration,
			...callbacks,
		});

		// Verify callback order
		expect(callOrder).toEqual([
			"act-start",
			"sequence-start",
			"step-start",
			"step-complete",
			"sequence-complete",
			"act-complete",
		]);

		// Verify all callbacks were called
		Object.values(callbacks).forEach((callback) => {
			expect(callback).toHaveBeenCalledTimes(1);
		});
	});

	it("handles empty sequences gracefully", async () => {
		let currentAct = createTestAct({
			sequences: [createTestSequence({ steps: [] })],
			steps: {
				queued: 0,
				inProgress: 0,
				completed: 0,
				warning: 0,
				cancelled: 0,
				failed: 0,
			},
		});

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const startGeneration = vi.fn();

		await executeAct({ act: currentAct, applyPatches, startGeneration });

		expect(currentAct.status).toBe("completed");
		expect(currentAct.sequences[0].status).toBe("completed");
		expect(startGeneration).not.toHaveBeenCalled();
	});

	it("handles callback errors without breaking execution", async () => {
		let currentAct = createTestAct();

		const applyPatches = vi.fn((_id: string, patches) => {
			currentAct = patchAct(currentAct, ...patches);
			return Promise.resolve();
		});

		const startGeneration = vi.fn(async (_id: string, callbacks?) => {
			await callbacks?.onCompleted?.();
		});

		const callbackError = new Error("Callback failed");
		const onStepStart = vi.fn(() => {
			throw callbackError;
		});

		// Should not throw even with callback error
		const result = await executeAct({
			act: currentAct,
			applyPatches,
			startGeneration,
			onStepStart,
		});

		// Act should fail because the callback error causes step to fail
		expect(result.hasError).toBe(true);
		expect(currentAct.status).toBe("failed");
	});
});

describe("transition validators", () => {
	describe("isValidActTransition", () => {
		it("allows valid transitions", () => {
			expect(isValidActTransition("inProgress", "completed")).toBe(true);
			expect(isValidActTransition("inProgress", "failed")).toBe(true);
			expect(isValidActTransition("inProgress", "cancelled")).toBe(true);
		});

		it("rejects invalid transitions", () => {
			expect(isValidActTransition("completed", "inProgress")).toBe(false);
			expect(isValidActTransition("failed", "completed")).toBe(false);
			expect(isValidActTransition("cancelled", "failed")).toBe(false);
		});
	});

	describe("isValidGenerationTransition", () => {
		it("allows valid transitions", () => {
			expect(isValidGenerationTransition("created", "queued")).toBe(true);
			expect(isValidGenerationTransition("queued", "running")).toBe(true);
			expect(isValidGenerationTransition("running", "completed")).toBe(true);
		});

		it("allows cancellation from non-terminal states", () => {
			expect(isValidGenerationTransition("created", "cancelled")).toBe(true);
			expect(isValidGenerationTransition("queued", "cancelled")).toBe(true);
			expect(isValidGenerationTransition("running", "cancelled")).toBe(true);
		});

		it("rejects invalid transitions", () => {
			expect(isValidGenerationTransition("completed", "running")).toBe(false);
			expect(isValidGenerationTransition("failed", "completed")).toBe(false);
			expect(isValidGenerationTransition("running", "queued")).toBe(false);
		});
	});
});

describe("createStepCountPatches", () => {
	it("creates patches to move counts between states", () => {
		const patches = createStepCountPatches("queued", "completed", 3);

		expect(patches).toEqual([
			{ path: "steps.queued", decrement: 3 },
			{ path: "steps.completed", increment: 3 },
		]);
	});
});
