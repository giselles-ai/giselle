import { createIdGeneratorV4 as createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod/v4";
import { WorkspaceId } from "..";
import { NodeId } from "../../node";

export const WorkspaceGitHubIntegrationId = createIdGenerator("wrkgth");
export type WorkspaceGitHubIntegrationId =
	typeof WorkspaceGitHubIntegrationId.schema;

export const WorkspaceGitHubIntegrationTrigger = z.enum([
	"github.issues.opened",
	"github.issues.closed",
	"github.issue_comment.created",
	"github.pull_request_comment.created",
	"github.pull_request.opened",
	"github.pull_request.ready_for_review",
	"github.pull_request.closed",
]);
export type WorkspaceGitHubIntegrationTrigger = z.infer<
	typeof WorkspaceGitHubIntegrationTrigger
>;

export const WorkspaceGitHubIntegrationNextActionIssueCommentCreate = z.literal(
	"github.issue_comment.create",
);
export const WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate =
	z.literal("github.pull_request_comment.create");

export const WorkspaceGitHubIntegrationNextAction = z.union([
	WorkspaceGitHubIntegrationNextActionIssueCommentCreate,
	WorkspaceGitHubIntegrationNextActionPullRequestCommentCreate,
]);
export type WorkspaceGitHubNextIntegrationAction = z.infer<
	typeof WorkspaceGitHubIntegrationNextAction
>;

export const WorkspaceGitHubIntegrationPayloadField = z.enum([
	"github.issues.title",
	"github.issues.body",
	"github.issue_comment.issue.number",
	"github.issue_comment.issue.repository.owner",
	"github.issue_comment.issue.repository.name",
	"github.issue_comment.body",
	"github.issue_comment.issue.title",
	"github.issue_comment.issue.body",
	"github.pull_request_comment.pull_request.number",
	"github.pull_request_comment.pull_request.repository.owner",
	"github.pull_request_comment.pull_request.repository.name",
	"github.pull_request_comment.pull_request.title",
	"github.pull_request_comment.pull_request.body",
	"github.pull_request_comment.body",
	"github.pull_request_comment.pull_request.diff",
	"github.pull_request.title",
	"github.pull_request.body",
	"github.pull_request.diff",
]);
export type WorkspaceGitHubIntegrationPayloadField = z.infer<
	typeof WorkspaceGitHubIntegrationPayloadField
>;

export const WorkspaceGitHubIntegrationPayloadNodeMap = z.object({
	payload: WorkspaceGitHubIntegrationPayloadField,
	nodeId: NodeId.schema,
});
export type WorkspaceGitHubIntegrationPayloadNodeMap = z.infer<
	typeof WorkspaceGitHubIntegrationPayloadNodeMap
>;

export const WorkspaceGitHubIntegrationSetting = z.object({
	id: WorkspaceGitHubIntegrationId.schema,
	workspaceId: WorkspaceId.schema,
	repositoryNodeId: z.string(),
	callsign: z.string().nullable(),
	event: WorkspaceGitHubIntegrationTrigger,
	payloadMaps: z.array(WorkspaceGitHubIntegrationPayloadNodeMap),
	nextAction: WorkspaceGitHubIntegrationNextAction,
});
export type WorkspaceGitHubIntegrationSetting = z.infer<
	typeof WorkspaceGitHubIntegrationSetting
>;
