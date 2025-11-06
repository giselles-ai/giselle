import {
	type GitHubFlowTriggerEvent,
	type GitHubTriggerEventId,
	type Output,
	OutputId,
	type Trigger,
	TriggerId,
	type TriggerNode,
} from "@giselles-ai/protocol";
import { findGitHubTriggerOption } from "@giselles-ai/trigger-registry";

/**
 * Type definitions for trigger configuration options
 */
interface TriggerConfigOptions {
	nodeId: string;
	workspaceId?: string;
	eventId: GitHubTriggerEventId;
	repositoryNodeId: string;
	installationId: number;
	callsign?: string;
	useExperimentalStorage?: boolean;
}

/**
 * Result of a successful trigger configuration
 */
interface TriggerConfigResult {
	triggerId: string;
	outputs: Output[];
	name: string;
}

/**
 * Creates a GitHubFlowTriggerEvent based on the event ID and optional callsign/labels
 */
export function createTriggerEvent(args: {
	eventId: GitHubTriggerEventId;
	callsign?: string;
	labels?: string[];
}): GitHubFlowTriggerEvent {
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

/**
 * Determines if a trigger type requires a callsign
 */
function isTriggerRequiringCallsign(eventId: GitHubTriggerEventId): boolean {
	return [
		"github.issue_comment.created",
		"github.pull_request_comment.created",
		"github.pull_request_review_comment.created",
		"github.discussion_comment.created",
	].includes(eventId);
}

/**
 * Generates the outputs for a given trigger
 */
function generateTriggerOutputs(eventId: GitHubTriggerEventId): Output[] {
	const triggerOption = findGitHubTriggerOption(eventId);
	if (triggerOption === undefined) {
		throw new Error(`Trigger not found for eventId: ${eventId}`);
	}
	const outputs: Output[] = [];

	for (const item of triggerOption.payload) {
		outputs.push({
			id: OutputId.generate(),
			label: item.label,
			accessor: item.key,
		});
	}

	return outputs;
}

/**
 * Creates the configuration payload for the trigger
 */
function createTriggerConfiguration(options: TriggerConfigOptions) {
	const {
		nodeId,
		workspaceId,
		eventId,
		repositoryNodeId,
		installationId,
		callsign,
	} = options;

	// Validate required fields
	if (!nodeId) throw new Error("Node ID is required");
	if (!eventId) throw new Error("Event ID is required");
	if (!repositoryNodeId) throw new Error("Repository Node ID is required");
	if (!installationId) throw new Error("Installation ID is required");

	// Validate callsign if required
	if (
		isTriggerRequiringCallsign(eventId) &&
		(!callsign || callsign.length === 0)
	) {
		throw new Error(`Callsign is required for trigger type: ${eventId}`);
	}

	const triggerOption = findGitHubTriggerOption(eventId);
	if (!triggerOption)
		throw new Error(`Trigger option not found for event ID: ${eventId}`);

	const event = createTriggerEvent({ eventId, callsign });
	const outputs = generateTriggerOutputs(eventId);
	const name = `On ${triggerOption.label}`;

	return {
		trigger: {
			id: TriggerId.generate(),
			nodeId: nodeId as `nd-${string}`,
			workspaceId: workspaceId as `wrks-${string}`,
			enable: false,
			configuration: {
				provider: "github" as const,
				repositoryNodeId,
				installationId,
				event,
			},
		},
		outputs,
		name,
	};
}

/**
 * Updates the node data with the configured trigger
 */
function updateNodeWithTrigger(
	node: TriggerNode,
	triggerId: string,
	outputs: Output[],
	triggerName: string,
) {
	if (!node) throw new Error("Node is required");
	if (!triggerId) throw new Error("Trigger ID is required");

	return {
		content: {
			...node.content,
			state: {
				status: "configured" as const,
				flowTriggerId: triggerId as TriggerId,
			},
		},
		outputs: [...node.outputs, ...outputs],
		name: triggerName,
	};
}

/**
 * Handles the complete trigger configuration process
 * Combines creating the configuration, making the API call, and updating the node
 */
async function _configureTriggerAndUpdateNode(
	client: {
		configureTrigger: (options: {
			trigger: Trigger;
			useExperimentalStorage?: boolean;
		}) => Promise<{ triggerId: string }>;
	},
	node: TriggerNode,
	options: TriggerConfigOptions,
	updateNodeData: (node: TriggerNode, data: Partial<TriggerNode>) => void,
): Promise<TriggerConfigResult> {
	try {
		// Create configuration
		const config = createTriggerConfiguration(options);

		// Configure trigger via API
		const { triggerId } = await client.configureTrigger({
			trigger: config.trigger,
			useExperimentalStorage: options.useExperimentalStorage,
		});

		// Update node data
		const nodeData = updateNodeWithTrigger(
			node,
			triggerId,
			config.outputs,
			config.name,
		);

		updateNodeData(node, nodeData);

		return {
			triggerId,
			outputs: config.outputs,
			name: config.name,
		};
	} catch (error) {
		console.error("Failed to configure trigger:", error);
		throw error;
	}
}
