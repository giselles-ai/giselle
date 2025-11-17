import type { Task } from "@giselles-ai/protocol";
import type { Patch } from "./patch-object";

// Type-safe patch creators for Task fields

// Status patches
const status = {
	set: (value: Task["status"]): Patch => ({
		path: "status",
		set: value,
	}),
} as const;

// Steps patches
const steps = {
	queued: {
		set: (value: Task["steps"]["queued"]): Patch => ({
			path: "steps.queued",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "steps.queued",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "steps.queued",
			decrement: value,
		}),
	},
	inProgress: {
		set: (value: Task["steps"]["inProgress"]): Patch => ({
			path: "steps.inProgress",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "steps.inProgress",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "steps.inProgress",
			decrement: value,
		}),
	},
	completed: {
		set: (value: Task["steps"]["completed"]): Patch => ({
			path: "steps.completed",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "steps.completed",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "steps.completed",
			decrement: value,
		}),
	},
	warning: {
		set: (value: Task["steps"]["warning"]): Patch => ({
			path: "steps.warning",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "steps.warning",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "steps.warning",
			decrement: value,
		}),
	},
	cancelled: {
		set: (value: Task["steps"]["cancelled"]): Patch => ({
			path: "steps.cancelled",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "steps.cancelled",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "steps.cancelled",
			decrement: value,
		}),
	},
	failed: {
		set: (value: Task["steps"]["failed"]): Patch => ({
			path: "steps.failed",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "steps.failed",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "steps.failed",
			decrement: value,
		}),
	},
} as const;

// Duration patches
const duration = {
	wallClock: {
		set: (value: Task["duration"]["wallClock"]): Patch => ({
			path: "duration.wallClock",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "duration.wallClock",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "duration.wallClock",
			decrement: value,
		}),
	},
	totalTask: {
		set: (value: Task["duration"]["totalTask"]): Patch => ({
			path: "duration.totalTask",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "duration.totalTask",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "duration.totalTask",
			decrement: value,
		}),
	},
} as const;

// Usage patches
const usage = {
	inputTokens: {
		set: (value: Task["usage"]["inputTokens"]): Patch => ({
			path: "usage.promptTokens",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "usage.promptTokens",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "usage.promptTokens",
			decrement: value,
		}),
	},
	outputTokens: {
		set: (value: Task["usage"]["outputTokens"]): Patch => ({
			path: "usage.completionTokens",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "usage.completionTokens",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "usage.completionTokens",
			decrement: value,
		}),
	},
	totalTokens: {
		set: (value: Task["usage"]["totalTokens"]): Patch => ({
			path: "usage.totalTokens",
			set: value,
		}),
		increment: (value: number): Patch => ({
			path: "usage.totalTokens",
			increment: value,
		}),
		decrement: (value: number): Patch => ({
			path: "usage.totalTokens",
			decrement: value,
		}),
	},
} as const;

// Annotations patches
const annotations = {
	push: (items: Task["annotations"]): Patch => ({
		path: "annotations",
		push: items,
	}),
	set: (items: Task["annotations"]): Patch => ({
		path: "annotations",
		set: items,
	}),
} as const;

// Sequences patches with dynamic indices
const sequences = (index: number) => ({
	status: {
		set: (value: Task["sequences"][number]["status"]): Patch => ({
			path: `sequences.${index}.status`,
			set: value,
		}),
	},
	duration: {
		wallClock: {
			set: (
				value: Task["sequences"][number]["duration"]["wallClock"],
			): Patch => ({
				path: `sequences.${index}.duration.wallClock`,
				set: value,
			}),
			increment: (value: number): Patch => ({
				path: `sequences.${index}.duration.wallClock`,
				increment: value,
			}),
			decrement: (value: number): Patch => ({
				path: `sequences.${index}.duration.wallClock`,
				decrement: value,
			}),
		},
		totalTask: {
			set: (
				value: Task["sequences"][number]["duration"]["totalTask"],
			): Patch => ({
				path: `sequences.${index}.duration.totalTask`,
				set: value,
			}),
			increment: (value: number): Patch => ({
				path: `sequences.${index}.duration.totalTask`,
				increment: value,
			}),
			decrement: (value: number): Patch => ({
				path: `sequences.${index}.duration.totalTask`,
				decrement: value,
			}),
		},
	},
	usage: {
		inputTokens: {
			set: (
				value: Task["sequences"][number]["usage"]["inputTokens"],
			): Patch => ({
				path: `sequences.${index}.usage.inputTokens`,
				set: value,
			}),
			increment: (value: number): Patch => ({
				path: `sequences.${index}.usage.inputTokens`,
				increment: value,
			}),
			decrement: (value: number): Patch => ({
				path: `sequences.${index}.usage.inputTokens`,
				decrement: value,
			}),
		},
		outputTokens: {
			set: (
				value: Task["sequences"][number]["usage"]["outputTokens"],
			): Patch => ({
				path: `sequences.${index}.usage.outputTokens`,
				set: value,
			}),
			increment: (value: number): Patch => ({
				path: `sequences.${index}.usage.outputTokens`,
				increment: value,
			}),
			decrement: (value: number): Patch => ({
				path: `sequences.${index}.usage.outputTokens`,
				decrement: value,
			}),
		},
		totalTokens: {
			set: (
				value: Task["sequences"][number]["usage"]["totalTokens"],
			): Patch => ({
				path: `sequences.${index}.usage.totalTokens`,
				set: value,
			}),
			increment: (value: number): Patch => ({
				path: `sequences.${index}.usage.totalTokens`,
				increment: value,
			}),
			decrement: (value: number): Patch => ({
				path: `sequences.${index}.usage.totalTokens`,
				decrement: value,
			}),
		},
	},
	steps: (stepIndex: number) => ({
		status: {
			set: (
				value: Task["sequences"][number]["steps"][number]["status"],
			): Patch => ({
				path: `sequences.${index}.steps.${stepIndex}.status`,
				set: value,
			}),
		},
		name: {
			set: (
				value: Task["sequences"][number]["steps"][number]["name"],
			): Patch => ({
				path: `sequences.${index}.steps.${stepIndex}.name`,
				set: value,
			}),
		},
		duration: {
			set: (
				value: Task["sequences"][number]["steps"][number]["duration"],
			): Patch => ({
				path: `sequences.${index}.steps.${stepIndex}.duration`,
				set: value,
			}),
			increment: (value: number): Patch => ({
				path: `sequences.${index}.steps.${stepIndex}.duration`,
				increment: value,
			}),
			decrement: (value: number): Patch => ({
				path: `sequences.${index}.steps.${stepIndex}.duration`,
				decrement: value,
			}),
		},
		usage: {
			inputTokens: {
				set: (
					value: Task["sequences"][number]["steps"][number]["usage"]["inputTokens"],
				): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.inputTokens`,
					set: value,
				}),
				increment: (value: number): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.inputTokens`,
					increment: value,
				}),
				decrement: (value: number): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.inputTokens`,
					decrement: value,
				}),
			},
			outputTokens: {
				set: (
					value: Task["sequences"][number]["steps"][number]["usage"]["outputTokens"],
				): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.outputTokens`,
					set: value,
				}),
				increment: (value: number): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.outputTokens`,
					increment: value,
				}),
				decrement: (value: number): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.outputTokens`,
					decrement: value,
				}),
			},
			totalTokens: {
				set: (
					value: Task["sequences"][number]["steps"][number]["usage"]["totalTokens"],
				): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.totalTokens`,
					set: value,
				}),
				increment: (value: number): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.totalTokens`,
					increment: value,
				}),
				decrement: (value: number): Patch => ({
					path: `sequences.${index}.steps.${stepIndex}.usage.totalTokens`,
					decrement: value,
				}),
			},
		},
	}),
});

// Other simple fields
const trigger = {
	set: (value: Task["trigger"]): Patch => ({ path: "trigger", set: value }),
} as const;

const updatedAt = {
	set: (value: Task["updatedAt"]): Patch => ({ path: "updatedAt", set: value }),
} as const;

// Convenience re-export of all patch creators
export const patches = {
	status,
	steps,
	duration,
	usage,
	annotations,
	sequences,
	trigger,
	updatedAt,
} as const;
