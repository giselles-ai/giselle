import type { FC } from "react";
import type { Node, NodeGraph, Port } from "../nodes";
import type { AgentId } from "../types";
export type RequestId = `rqst_${string}`;
export type RequestStackId = `rqst.stck_${string}`;
export type RequestStepId = `rqst.stp_${string}`;

export type RequestStartHandlerArgs = {
	requestId: RequestId;
};
export type RequestStartHandler = (
	args: RequestStartHandlerArgs,
) => Promise<void>;

export const requestRunnerProvider = {
	vercelFunctions: "vercelFunctions",
	triggerDev: "triggerDev",
};
export type RequestRunnerProvider = keyof typeof requestRunnerProvider;

export const requestStepStatus = {
	inProgress: "in_progress",
	cancelled: "cancelled",
	failed: "failed",
	completed: "completed",
	expired: "expired",
} as const;
export type RequestStepStatus =
	(typeof requestStepStatus)[keyof typeof requestStepStatus];
export type RequestStep = {
	id: RequestStepId;
	node: NodeGraph;
	status: RequestStepStatus;
	portMessages: Array<{
		portId: Port["id"];
		message: string;
	}>;
};
export type RequestStack = {
	id: RequestStackId;
	steps: RequestStep[];
};
export const requestStatus = {
	queued: "queued",
	inProgress: "in_progress",
	requiresAction: "requires_action",
	cancelling: "cancelling",
	cancelled: "cancelled",
	failed: "failed",
	completed: "completed",
	incomplete: "incomplete",
	expired: "expired",
} as const;
export type RequestStatus = (typeof requestStatus)[keyof typeof requestStatus];
export type Request = {
	id: RequestId;
	stacks: RequestStack[];
	status: RequestStatus;
	result: string | null;
};

export type RequestState = {
	agentId: AgentId;
	request?: Request | undefined | null;
};
