import type { GitHubEvent } from "@giselles-ai/protocol";
import type { GitHubEventId } from "@giselles-ai/trigger-registry";

/**
 * Creates a GitHubFlowTriggerEvent based on the event ID and optional callsign/labels
 */
export function createTriggerEvent(args: {
	eventId: GitHubEventId;
	callsign?: string;
	labels?: string[];
}): GitHubEvent {
	switch (args.eventId) {
		case "github.issue.created":
		case "github.issue.closed":
		case "github.pull_request.ready_for_review":
		case "github.pull_request.closed":
		case "github.pull_request.opened":
		case "github.discussion.created":
			return {
				id: args.eventId,
			};
		case "github.issue_comment.created":
		case "github.pull_request_comment.created":
		case "github.pull_request_review_comment.created":
		case "github.discussion_comment.created":
			if (!args.callsign || args.callsign.length === 0) {
				throw new Error("Callsign is required for this trigger type");
			}
			return {
				id: args.eventId,
				conditions: {
					callsign: args.callsign,
				},
			};
		case "github.issue.labeled":
		case "github.pull_request.labeled":
			if (!args.labels || args.labels.length === 0) {
				throw new Error("Labels are required for this trigger type");
			}
			return {
				id: args.eventId,
				conditions: { labels: args.labels },
			};
		default: {
			const _exhaustiveCheck: never = args.eventId;
			throw new Error(`Unhandled eventId: ${_exhaustiveCheck}`);
		}
	}
}
