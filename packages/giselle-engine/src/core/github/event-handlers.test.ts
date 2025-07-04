import type { FlowTrigger } from "@giselle-sdk/data-type";
import { FlowTriggerId } from "@giselle-sdk/data-type";
import type {
	ensureWebhookEvent,
	GitHubAuthConfig,
	WebhookEvent,
	WebhookEventName,
} from "@giselle-sdk/github-tool";
import { createStorage } from "unstorage";
import memoryDriver from "unstorage/drivers/memory";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GiselleEngineContext } from "../types";
import {
	type EventHandlerArgs,
	type EventHandlerDependencies,
	handleIssueClosed,
	handleIssueCommentCreated,
	handleIssueOpened,
	handlePullRequestClosed,
	handlePullRequestCommentCreated,
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
const mockFlowTriggerId = FlowTriggerId.generate();

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
			runFlow: vi.fn().mockResolvedValue(undefined),
			parseCommand: vi
				.fn()
				.mockReturnValue({ callsign: "giselle", content: "help me" }),
			createIssueComment: vi.fn().mockResolvedValue({ id: 1 }),
			createPullRequestComment: vi.fn().mockResolvedValue({ id: 1 }),
			replyPullRequestReviewComment: vi.fn().mockResolvedValue({ id: 1 }),
			updateIssueComment: vi.fn().mockResolvedValue(undefined),
			updatePullRequestReviewComment: vi.fn().mockResolvedValue(undefined),
		};

		// Setup base arguments
		baseEventArgs = {
			context: {
				storage: createStorage({ driver: memoryDriver() }),
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
				id: mockFlowTriggerId,
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
			} as FlowTrigger,
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

	describe("processEvent", () => {
		it("should process event and run flow when handler returns shouldRun=true", async () => {
			// Arrange
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
				id: mockFlowTriggerId,
				workspaceId: "wrks-test",
				nodeId: "nd-test",
				enable: true,
				configuration: {
					provider: "github",
					event: {
						id: "github.issue.created",
					},
					installationId: 12345,
					repositoryNodeId: "repo-node-id",
				},
			} as FlowTrigger;

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
					storage: createStorage({ driver: memoryDriver() }),
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
			expect(testDeps.runFlow).toHaveBeenCalledWith(
				expect.objectContaining({
					context: expect.anything(),
					triggerId: mockFlowTriggerId,
					triggerInputs: expect.any(Array),
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
				id: mockFlowTriggerId,
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
			} as FlowTrigger;

			// Act
			const result = await processEvent({
				event,
				context: {
					llmProviders: [],
					storage: createStorage({ driver: memoryDriver() }),
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
			expect(testDeps.runFlow).not.toHaveBeenCalled();
			expect(testDeps.addReaction).not.toHaveBeenCalled();
		});
	});
});
