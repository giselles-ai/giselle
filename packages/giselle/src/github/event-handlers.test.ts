import type {
	ensureWebhookEvent,
	GitHubAuthConfig,
	WebhookEvent,
	WebhookEventName,
} from "@giselles-ai/github-tool";
import { createTriggerNode } from "@giselles-ai/node-registry";
import {
	type GitHubEventData,
	NodeId,
	type Trigger,
	TriggerId,
} from "@giselles-ai/protocol";
import { memoryStorageDriver } from "@giselles-ai/storage";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GiselleEngineContext } from "../types";
import {
	type EventHandlerArgs,
	type EventHandlerDependencies,
	handleDiscussionCommentCreated,
	handleDiscussionCreated,
	handleIssueClosed,
	handleIssueCommentCreated,
	handleIssueLabeled,
	handleIssueOpened,
	handlePullRequestClosed,
	handlePullRequestCommentCreated,
	handlePullRequestLabeled,
	handlePullRequestOpened,
	handlePullRequestReadyForReview,
	handlePullRequestReviewCommentCreated,
	processEvent,
} from "./event-handlers";

// Helper function to create a mock implementation for ensureWebhookEvent
function createEnsureWebhookEventMock(shouldMatch = true) {
	return vi
		.fn()
		.mockImplementation(
			<T extends WebhookEventName>(
				event: WebhookEvent<WebhookEventName>,
				_expectedName: T,
			): event is WebhookEvent<T> => shouldMatch,
		) as unknown as typeof ensureWebhookEvent;
}

// Define test-specific types
type TestWebhookEvent = WebhookEvent<WebhookEventName>;

// Generate a valid test trigger ID
const mockTriggerId = TriggerId.generate();

describe("GitHub Event Handlers", () => {
	// Common test data
	let testDeps: EventHandlerDependencies;
	let baseEventArgs: Omit<EventHandlerArgs<WebhookEventName>, "event">;

	beforeEach(() => {
		vi.resetAllMocks();

		// Simple dependency mocks with correct type implementations
		testDeps = {
			addReaction: vi.fn().mockResolvedValue(undefined),
			ensureWebhookEvent: createEnsureWebhookEventMock(),
			createAndStartAct: vi.fn().mockResolvedValue(undefined),
			parseCommand: vi
				.fn()
				.mockReturnValue({ callsign: "giselle", content: "help me" }),
			createIssueComment: vi.fn().mockResolvedValue({ id: 1 }),
			createPullRequestComment: vi.fn().mockResolvedValue({ id: 1 }),
			replyPullRequestReviewComment: vi.fn().mockResolvedValue({ id: 1 }),
			updateIssueComment: vi.fn().mockResolvedValue(undefined),
			updatePullRequestReviewComment: vi.fn().mockResolvedValue(undefined),
			createDiscussionComment: vi
				.fn()
				.mockResolvedValue({ id: "disc_123", databaseId: 1 }),
			updateDiscussionComment: vi.fn().mockResolvedValue(undefined),
			getDiscussionForCommentCreation: vi.fn().mockReturnValue(undefined),
		};

		// Setup base arguments
		baseEventArgs = {
			context: {
				storage: memoryStorageDriver(),
				llmProviders: [],
				integrationConfigs: {
					github: {
						auth: {
							strategy: "personal-access-token",
							personalAccessToken: "test-token",
						},
						authV2: {
							appId: "app-id",
							privateKey: "private-key",
							clientId: "client-id",
							clientSecret: "client-secret",
							webhookSecret: "webhook-secret",
						},
					},
				},
			} as unknown as GiselleEngineContext,
			trigger: {
				id: mockTriggerId,
				workspaceId: "wrks-test",
				nodeId: "nd-test",
				configuration: {
					provider: "github",
					event: {
						id: "github.issue.created",
						conditions: {
							callsign: "giselle",
						},
					},
					installationId: 12345,
					repositoryNodeId: "repo-node-id",
				},
				enable: true,
			} as Trigger,
			authConfig: {
				strategy: "app-installation",
				appId: "app-id",
				privateKey: "private-key",
				installationId: 12345,
			} as GitHubAuthConfig,
			deps: testDeps,
		};
	});

	describe("handleIssueOpened", () => {
		it("should handle issue opened event and add reaction", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.opened",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id" },
						},
					},
				} as TestWebhookEvent,
			};

			// Act
			const result = await handleIssueOpened(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "issue-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if event type doesn't match", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.opened",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.deps = {
				...args.deps,
				ensureWebhookEvent: createEnsureWebhookEventMock(false),
			};

			// Act
			const result = await handleIssueOpened(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if trigger event ID doesn't match", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.opened",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "manual";

			// Act
			const result = await handleIssueOpened(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handleIssueCommentCreated", () => {
		it("should handle issue comment created event with matching callsign", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issue_comment.created",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							comment: {
								node_id: "comment-node-id",
								body: "@giselle help me",
							},
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue_comment.created";

			// Act
			const result = await handleIssueCommentCreated(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "comment-node-id",
			});
			expect(args.deps.parseCommand).toHaveBeenCalledWith("@giselle help me");
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if callsign doesn't match", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issue_comment.created",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							comment: {
								node_id: "comment-node-id",
								body: "@someone help me",
							},
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue_comment.created";
			args.deps = {
				...args.deps,
				parseCommand: vi.fn().mockReturnValue({
					callsign: "someone",
					content: "help me",
				}),
			};

			// Act
			const result = await handleIssueCommentCreated(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handleIssueClosed", () => {
		it("should handle issue closed event and add reaction", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.closed",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue.closed";

			// Act
			const result = await handleIssueClosed(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "issue-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if trigger event ID doesn't match", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.closed",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue.created";

			// Act
			const result = await handleIssueClosed(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handlePullRequestOpened", () => {
		it("should handle pull request opened event and add reaction", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.opened",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.pull_request.opened";

			// Act
			const result = await handlePullRequestOpened(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "pr-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if trigger event ID doesn't match", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.opened",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue.created";

			// Act
			const result = await handlePullRequestOpened(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handlePullRequestClosed", () => {
		it("should handle pull request closed event and add reaction", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.closed",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.pull_request.closed";

			// Act
			const result = await handlePullRequestClosed(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "pr-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if trigger event ID doesn't match", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.closed",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue.created";

			// Act
			const result = await handlePullRequestClosed(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handlePullRequestCommentCreated", () => {
		it("should handle pull request comment created event with matching callsign", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issue_comment.created",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: {
								pull_request: {},
							},
							comment: {
								node_id: "comment-node-id",
								body: "@giselle help me",
							},
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id =
				"github.pull_request_comment.created";

			// Act
			const result = await handlePullRequestCommentCreated(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "comment-node-id",
			});

			describe("handlePullRequestReviewCommentCreated", () => {
				it("should handle pull request review comment created event with matching callsign", async () => {
					const args = {
						...baseEventArgs,
						event: {
							name: "pull_request_review_comment.created",
							data: {
								payload: {
									installation: { id: 12345 },
									repository: { node_id: "repo-node-id" },
									pull_request: {
										node_id: "pr-node-id",
										title: "PR",
										body: "body",
										number: 1,
									},
									comment: {
										node_id: "comment-node-id",
										body: "@giselle help",
									},
								},
							},
						} as TestWebhookEvent,
					};
					args.trigger.configuration.event.id =
						"github.pull_request_review_comment.created";

					const result = await handlePullRequestReviewCommentCreated(args);

					expect(result).toEqual({
						shouldRun: true,
						reactionNodeId: "comment-node-id",
					});
					expect(args.deps.parseCommand).toHaveBeenCalledWith("@giselle help");
					expect(args.deps.addReaction).not.toHaveBeenCalled();
				});

				it("should not run if callsign doesn't match", async () => {
					const args = {
						...baseEventArgs,
						event: {
							name: "pull_request_review_comment.created",
							data: {
								payload: {
									installation: { id: 12345 },
									repository: { node_id: "repo-node-id" },
									pull_request: {
										node_id: "pr-node-id",
										title: "PR",
										body: "body",
										number: 1,
									},
									comment: {
										node_id: "comment-node-id",
										body: "@someone help",
									},
								},
							},
						} as TestWebhookEvent,
					};
					args.trigger.configuration.event.id =
						"github.pull_request_review_comment.created";
					args.deps = {
						...args.deps,
						parseCommand: vi.fn().mockReturnValue({
							callsign: "someone",
							content: "help",
						}),
					};

					const result = await handlePullRequestReviewCommentCreated(args);

					expect(result).toEqual({ shouldRun: false });
					expect(args.deps.addReaction).not.toHaveBeenCalled();
				});
			});
			expect(args.deps.parseCommand).toHaveBeenCalledWith("@giselle help me");
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if callsign doesn't match", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issue_comment.created",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: {
								pull_request: {},
							},
							comment: {
								node_id: "comment-node-id",
								body: "@someone help me",
							},
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id =
				"github.pull_request_comment.created";
			args.deps = {
				...args.deps,
				parseCommand: vi.fn().mockReturnValue({
					callsign: "someone",
					content: "help me",
				}),
			};

			// Act
			const result = await handlePullRequestCommentCreated(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handlePullRequestReadyForReview", () => {
		it("should handle pull request ready for review event and add reaction", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.ready_for_review",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id =
				"github.pull_request.ready_for_review";

			// Act
			const result = await handlePullRequestReadyForReview(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "pr-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if trigger event ID doesn't match", async () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.ready_for_review",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue.created";

			// Act
			const result = await handlePullRequestReadyForReview(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handleIssueLabeled", () => {
		it("should handle issue labeled event with matching label", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id", number: 123 },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.issue.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handleIssueLabeled(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "issue-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should handle issue labeled event with one of multiple matching labels", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id", number: 123 },
							label: { name: "feature" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.issue.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handleIssueLabeled(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "issue-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if added label doesn't match configured labels", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id", number: 123 },
							label: { name: "documentation" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.issue.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handleIssueLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if event type doesn't match", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id", number: 123 },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.issue.labeled",
				conditions: { labels: ["bug", "feature"] },
			};
			args.deps = {
				...args.deps,
				ensureWebhookEvent: createEnsureWebhookEventMock(false),
			};

			// Act
			const result = handleIssueLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if trigger event ID doesn't match", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id", number: 123 },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue.created";

			// Act
			const result = handleIssueLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if issue object is missing", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.issue.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handleIssueLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if label object is missing", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id", number: 123 },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.issue.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handleIssueLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if labels condition is missing", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "issues.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							issue: { node_id: "issue-node-id", number: 123 },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.issue.labeled",
			} as GitHubEventData;

			// Act
			const result = handleIssueLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handlePullRequestLabeled", () => {
		it("should handle pull request labeled event with matching label", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id", number: 123 },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.pull_request.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handlePullRequestLabeled(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "pr-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should handle pull request labeled event with one of multiple matching labels", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id", number: 123 },
							label: { name: "feature" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.pull_request.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handlePullRequestLabeled(args);

			// Assert
			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "pr-node-id",
			});
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if added label doesn't match configured labels", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id", number: 123 },
							label: { name: "documentation" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.pull_request.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handlePullRequestLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if event type doesn't match", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id", number: 123 },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.pull_request.labeled",
				conditions: { labels: ["bug", "feature"] },
			};
			args.deps = {
				...args.deps,
				ensureWebhookEvent: createEnsureWebhookEventMock(false),
			};

			// Act
			const result = handlePullRequestLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if trigger event ID doesn't match", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id", number: 123 },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.issue.created";

			// Act
			const result = handlePullRequestLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if pull_request object is missing", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.pull_request.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handlePullRequestLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if label object is missing", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id", number: 123 },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.pull_request.labeled",
				conditions: { labels: ["bug", "feature"] },
			};

			// Act
			const result = handlePullRequestLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});

		it("should not run if labels condition is missing", () => {
			// Arrange
			const args = {
				...baseEventArgs,
				event: {
					name: "pull_request.labeled",
					data: {
						payload: {
							installation: { id: 12345 },
							repository: { node_id: "repo-node-id" },
							pull_request: { node_id: "pr-node-id", number: 123 },
							label: { name: "bug" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event = {
				id: "github.pull_request.labeled",
			} as GitHubEventData;

			// Act
			const result = handlePullRequestLabeled(args);

			// Assert
			expect(result).toEqual({ shouldRun: false });
			expect(args.deps.addReaction).not.toHaveBeenCalled();
		});
	});

	describe("handleDiscussionCreated", () => {
		it("should handle discussion created event and react to discussion node", () => {
			const args = {
				...baseEventArgs,
				event: {
					name: "discussion.created",
					data: {
						payload: {
							discussion: { node_id: "discussion-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.discussion.created";

			const result = handleDiscussionCreated(args);

			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "discussion-node-id",
			});
		});

		it("should not run when ensureWebhookEvent returns false", () => {
			const args = {
				...baseEventArgs,
				event: {
					name: "discussion.created",
					data: {
						payload: {
							discussion: { node_id: "discussion-node-id" },
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.discussion.created";
			args.deps = {
				...args.deps,
				ensureWebhookEvent: createEnsureWebhookEventMock(false),
			};

			const result = handleDiscussionCreated(args);

			expect(result).toEqual({ shouldRun: false });
		});

		it("should not run when discussion payload is missing", () => {
			const args = {
				...baseEventArgs,
				event: {
					name: "discussion.created",
					data: {
						payload: {},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.discussion.created";

			const result = handleDiscussionCreated(args);

			expect(result).toEqual({ shouldRun: false });
		});
	});

	describe("handleDiscussionCommentCreated", () => {
		it("should handle discussion comment created event with matching callsign", () => {
			const args = {
				...baseEventArgs,
				event: {
					name: "discussion_comment.created",
					data: {
						payload: {
							comment: {
								node_id: "comment-node-id",
								body: "@giselle run",
							},
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.discussion_comment.created";

			const result = handleDiscussionCommentCreated(args);

			expect(result).toEqual({
				shouldRun: true,
				reactionNodeId: "comment-node-id",
			});
			expect(args.deps.parseCommand).toHaveBeenCalledWith("@giselle run");
		});

		it("should not run when ensureWebhookEvent returns false", () => {
			const args = {
				...baseEventArgs,
				event: {
					name: "discussion_comment.created",
					data: {
						payload: {
							comment: {
								node_id: "comment-node-id",
								body: "@giselle run",
							},
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.discussion_comment.created";
			args.deps = {
				...args.deps,
				ensureWebhookEvent: createEnsureWebhookEventMock(false),
			};

			const result = handleDiscussionCommentCreated(args);

			expect(result).toEqual({ shouldRun: false });
		});

		it("should not run when callsign does not match", () => {
			const args = {
				...baseEventArgs,
				event: {
					name: "discussion_comment.created",
					data: {
						payload: {
							comment: {
								node_id: "comment-node-id",
								body: "@someone do something",
							},
						},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.discussion_comment.created";
			args.deps = {
				...args.deps,
				parseCommand: vi.fn().mockReturnValue({
					callsign: "someone",
					content: "do something",
				}),
			};

			const result = handleDiscussionCommentCreated(args);

			expect(result).toEqual({ shouldRun: false });
		});

		it("should not run when comment payload is missing", () => {
			const args = {
				...baseEventArgs,
				event: {
					name: "discussion_comment.created",
					data: {
						payload: {},
					},
				} as TestWebhookEvent,
			};
			args.trigger.configuration.event.id = "github.discussion_comment.created";

			const result = handleDiscussionCommentCreated(args);

			expect(result).toEqual({ shouldRun: false });
		});
	});

	describe("processEvent", () => {
		it("should process event and run flow when handler returns shouldRun=true", async () => {
			// Arrange
			const testNodeId = NodeId.generate();
			const event = {
				name: "issues.opened",
				data: {
					payload: {
						installation: { id: 12345 },
						repository: { node_id: "repo-node-id" },
						issue: { node_id: "issue-node-id" },
					},
				},
			} as TestWebhookEvent;

			const trigger = {
				id: mockTriggerId,
				workspaceId: "wrks-test",
				nodeId: testNodeId,
				enable: true,
				configuration: {
					provider: "github",
					event: {
						id: "github.issue.created",
					},
					installationId: 12345,
					repositoryNodeId: "repo-node-id",
				},
			} as Trigger;

			const createAuthConfig = vi.fn().mockReturnValue({
				strategy: "app-installation",
				appId: "app-id",
				privateKey: "private-key",
				installationId: 12345,
			});

			// Act
			const _result = await processEvent({
				event,
				context: {
					llmProviders: [],
					storage: {
						getJson: vi.fn().mockResolvedValue({
							id: "wrks-test",
							name: "Test Workspace",
							nodes: [
								{
									...createTriggerNode("github"),
									id: testNodeId,
									name: "GitHub Trigger",
								},
							],
							connections: [],
						}),
					},
					integrationConfigs: {
						github: {
							auth: {
								strategy: "personal-access-token",
								personalAccessToken: "test-token",
							},
							authV2: {
								appId: "app-id",
								privateKey: "private-key",
								clientId: "client-id",
								clientSecret: "client-secret",
								webhookSecret: "webhook-secret",
							},
						},
					},
				} as unknown as GiselleEngineContext,
				trigger,
				createAuthConfig,
				deps: testDeps,
			});

			// Assert
			expect(testDeps.createAndStartAct).toHaveBeenCalledWith(
				expect.objectContaining({
					context: expect.anything(),
					nodeId: expect.any(String),
					workspace: expect.objectContaining({
						id: "wrks-test",
					}),
					generationOriginType: "github-app",
					inputs: expect.arrayContaining([
						expect.objectContaining({
							type: "github-webhook-event",
							webhookEvent: expect.objectContaining({
								name: "issues.opened",
							}),
						}),
					]),
				}),
			);
			expect(testDeps.addReaction).toHaveBeenCalledWith({
				id: "issue-node-id",
				content: "EYES",
				authConfig: expect.anything(),
			});
			expect(testDeps.createIssueComment).not.toHaveBeenCalled();
		});

		it("should return false when trigger is disabled", async () => {
			// Arrange
			const event = {
				name: "issues.opened",
				data: {
					payload: {
						installation: { id: 12345 },
						repository: { node_id: "repo-node-id" },
					},
				},
			} as TestWebhookEvent;

			const trigger = {
				id: mockTriggerId,
				workspaceId: "wrks-test",
				nodeId: "nd-test",
				enable: false,
				configuration: {
					provider: "github",
					event: {
						id: "github.issue.created",
					},
					installationId: 12345,
					repositoryNodeId: "repo-node-id",
				},
			} as Trigger;

			// Act
			const result = await processEvent({
				event,
				context: {
					llmProviders: [],
					storage: memoryStorageDriver(),
					integrationConfigs: {
						github: {
							auth: {
								strategy: "personal-access-token",
								personalAccessToken: "test-token",
							},
							authV2: {
								appId: "app-id",
								privateKey: "private-key",
								clientId: "client-id",
								clientSecret: "client-secret",
								webhookSecret: "webhook-secret",
							},
						},
					},
				} as unknown as GiselleEngineContext,
				trigger,
				createAuthConfig: vi.fn(),
				deps: testDeps,
			});

			// Assert
			expect(result).toBe(false);
			expect(testDeps.createAndStartAct).not.toHaveBeenCalled();
			expect(testDeps.addReaction).not.toHaveBeenCalled();
		});
	});
});
