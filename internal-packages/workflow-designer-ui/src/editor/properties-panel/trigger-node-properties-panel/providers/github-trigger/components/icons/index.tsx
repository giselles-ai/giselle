import type { GitHubTriggerEventId } from "@giselle-sdk/flow";
import {
	Check,
	MessageSquareCode,
	MessageSquareText,
	MessagesSquare,
	Tag,
} from "lucide-react";

export interface IconProps {
	className?: string;
	size?: number;
	title?: string;
}

export function IssueCreatedIcon({
	className = "text-inverse",
	size = 18,
	title = "Issue Created",
}: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24.79 22.6"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-hidden="true"
			role="img"
			aria-label={title}
		>
			<title>{title}</title>
			<g>
				<path
					d="M.78,6.93h2.02l2.52,5.39,.14,.3h.06v-5.69h1.48v8.74h-1.88l-2.61-5.44-.19-.42h-.07v5.86H.78V6.93Z"
					fill="white"
					stroke="white"
					strokeMiterlimit="10"
					strokeWidth=".5"
				/>
				<path
					d="M8.1,6.93h5.48v1.71h-3.94v1.8h3.41v1.58h-3.41v1.93h3.92v1.71h-5.46V6.93Z"
					fill="white"
					stroke="white"
					strokeMiterlimit="10"
					strokeWidth=".5"
				/>
				<path
					d="M14.66,6.93h1.57l.8,5.65,.22,1.19h.07l1.09-6.84h1.91l1.08,6.84h.07l.19-1.12,.8-5.72h1.56l-1.42,8.74h-2.22l-.87-5.41-.11-.66h-.07l-.09,.66-.89,5.41h-2.23l-1.46-8.74Z"
					fill="currentColor"
					stroke="currentColor"
					strokeMiterlimit="10"
					strokeWidth=".5"
				/>
			</g>
			<rect width="24.79" height="2.24" fill="currentColor" />
			<rect y="20.36" width="24.79" height="2.24" fill="currentColor" />
		</svg>
	);
}

export function IssueClosedIcon({
	className = "text-inverse",
	size = 18,
	title = "Issue Closed",
}: IconProps) {
	return (
		<Check className={className} size={size} aria-label={title} role="img" />
	);
}

export function IssueCommentCreatedIcon({
	className = "text-inverse",
	size = 18,
	title = "Issue Comment Created",
}: IconProps) {
	return (
		<MessageSquareText
			className={className}
			size={size}
			aria-label={title}
			role="img"
		/>
	);
}

export function IssueLabeledIcon({
	className = "text-inverse",
	size = 18,
	title = "Issue Labeled",
}: IconProps) {
	return (
		<Tag className={className} size={size} aria-label={title} role="img" />
	);
}

export function PullRequestCommentCreatedIcon({
	className = "text-inverse",
	size = 18,
	title = "Pull Request Comment Created",
}: IconProps) {
	return (
		<MessageSquareText
			className={className}
			size={size}
			aria-label={title}
			role="img"
		/>
	);
}

export function PullRequestReviewCommentCreatedIcon({
	className = "text-inverse",
	size = 18,
	title = "Pull Request Review Comment Created",
}: IconProps) {
	return (
		<MessageSquareCode
			className={className}
			size={size}
			aria-label={title}
			role="img"
		/>
	);
}

export function PullRequestOpenedIcon({
	className = "text-inverse",
	size = 18,
	title = "Pull Request Opened",
}: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 28.81 28.68"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-hidden="true"
			role="img"
			aria-label={title}
		>
			<title>{title}</title>
			<path
				d="M12.37,18.31c-.59-.59-1.54-.59-2.12,0-.59.59-.59,1.54,0,2.12l1.38,1.38h-5.33v-10.37c1.91-.63,3.29-2.41,3.29-4.53,0-2.64-2.15-4.79-4.79-4.79S0,4.27,0,6.91c0,2.12,1.39,3.9,3.29,4.53v11.87c0,.83.67,1.5,1.5,1.5h6.31l-1.31,1.31c-.59.59-.59,1.54,0,2.12.29.29.68.44,1.06.44s.77-.15,1.06-.44l4.13-4.13c.59-.59.59-1.54,0-2.12l-3.68-3.68ZM4.79,5.11c.99,0,1.79.8,1.79,1.79s-.8,1.79-1.79,1.79-1.79-.81-1.79-1.79.81-1.79,1.79-1.79Z"
				fill="currentColor"
			/>
			<path
				d="M25.51,17.24V5.37c0-.83-.67-1.5-1.5-1.5h-6.31l1.31-1.31c.59-.59.59-1.54,0-2.12-.59-.59-1.54-.59-2.12,0l-4.13,4.13c-.59.59-.59,1.54,0,2.12l3.68,3.68c.29.29.68.44,1.06.44s.77-.15,1.06-.44c.59-.59.59-1.54,0-2.12l-1.38-1.38h5.33v10.37c-1.91.63-3.29,2.41-3.29,4.53,0,2.64,2.15,4.79,4.79,4.79s4.79-2.15,4.79-4.79c0-2.12-1.39-3.9-3.29-4.53ZM24.01,23.57c-.99,0-1.79-.8-1.79-1.79s.8-1.79,1.79-1.79,1.79.81,1.79,1.79-.8,1.79-1.79,1.79Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function PullRequestReadyForReviewIcon({
	className = "text-inverse",
	size = 18,
	title = "Pull Request Ready For Review",
}: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 28.81 26.63"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-hidden="true"
			role="img"
			aria-label={title}
		>
			<title>{title}</title>
			<path
				d="M25.51,17.24V5.37c0-.83-.67-1.5-1.5-1.5h-6.31l1.31-1.31c.59-.59.59-1.54,0-2.12-.59-.59-1.54-.59-2.12,0l-4.13,4.13c-.59.59-.59,1.54,0,2.12l3.68,3.68c.29.29.68.44,1.06.44s.77-.15,1.06-.44c.59-.59.59-1.54,0-2.12l-1.38-1.38h5.33v10.37c-1.91.63-3.29,2.41-3.29,4.53,0,2.64,2.15,4.79,4.79,4.79s4.79-2.15,4.79-4.79c0-2.12-1.39-3.9-3.29-4.53ZM24.01,23.57c-.99,0-1.79-.8-1.79-1.79s.81-1.79,1.79-1.79,1.79.81,1.79,1.79-.8,1.79-1.79,1.79Z"
				fill="currentColor"
			/>
			<path
				d="M6.29,17.29v-5.85c1.91-.63,3.29-2.41,3.29-4.53,0-2.64-2.15-4.79-4.79-4.79S0,4.27,0,6.91c0,2.12,1.39,3.9,3.29,4.53v5.89c-1.87.65-3.23,2.42-3.23,4.51,0,2.64,2.15,4.79,4.79,4.79s4.79-2.15,4.79-4.79c0-2.14-1.42-3.94-3.36-4.55ZM3,6.91c0-.99.8-1.79,1.79-1.79s1.79.8,1.79,1.79-.81,1.79-1.79,1.79-1.79-.81-1.79-1.79ZM4.86,23.63c-.99,0-1.79-.8-1.79-1.79s.81-1.79,1.79-1.79,1.79.8,1.79,1.79-.8,1.79-1.79,1.79Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function PullRequestClosedIcon({
	className = "text-inverse",
	size = 18,
	title = "Pull Request Closed",
}: IconProps) {
	return (
		<Check className={className} size={size} aria-label={title} role="img" />
	);
}

export function PullRequestLabeledIcon({
	className = "text-inverse",
	size = 18,
	title = "Pull Request Labeled",
}: IconProps) {
	return (
		<Tag className={className} size={size} aria-label={title} role="img" />
	);
}

export function DiscussionCreatedIcon({
	className = "text-inverse",
	size = 18,
	title = "Discussion Created",
}: IconProps) {
	return (
		<MessagesSquare
			className={className}
			size={size}
			aria-label={title}
			role="img"
		/>
	);
}

export function DiscussionCommentCreatedIcon({
	className = "text-inverse",
	size = 18,
	title = "Discussion Comment Created",
}: IconProps) {
	return (
		<MessageSquareText
			className={className}
			size={size}
			aria-label={title}
			role="img"
		/>
	);
}

function DefaultGitHubIcon({
	className = "text-inverse",
	size = 22,
	title = "GitHub",
}: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-hidden="true"
			role="img"
			aria-label={title}
		>
			<title>{title}</title>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.646.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.16 22 16.416 22 12c0-5.523-4.477-10-10-10z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function ArrowRightIcon({
	className = "text-inverse group-hover:text-inverse transition-colors flex-shrink-0 absolute right-4",
	size = 16,
	title = "Arrow Right",
}: IconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			aria-hidden="true"
			role="img"
			aria-label={title}
		>
			<title>{title}</title>
			<path
				d="M9 18L15 12L9 6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export function getTriggerIcon(
	triggerType: GitHubTriggerEventId,
	props: IconProps = {},
) {
	switch (triggerType) {
		case "github.issue.created":
			return <IssueCreatedIcon {...props} />;
		case "github.issue.closed":
			return <IssueClosedIcon {...props} />;
		case "github.issue_comment.created":
			return <IssueCommentCreatedIcon {...props} />;
		case "github.issue.labeled":
			return <IssueLabeledIcon {...props} />;
		case "github.pull_request_comment.created":
			return <PullRequestCommentCreatedIcon {...props} />;
		case "github.pull_request_review_comment.created":
			return <PullRequestReviewCommentCreatedIcon {...props} />;
		case "github.pull_request.opened":
			return <PullRequestOpenedIcon {...props} />;
		case "github.pull_request.ready_for_review":
			return <PullRequestReadyForReviewIcon {...props} />;
		case "github.pull_request.closed":
			return <PullRequestClosedIcon {...props} />;
		case "github.pull_request.labeled":
			return <PullRequestLabeledIcon {...props} />;
		case "github.discussion.created":
			return <DiscussionCreatedIcon {...props} />;
		case "github.discussion_comment.created":
			return <DiscussionCommentCreatedIcon {...props} />;
		default:
			return <DefaultGitHubIcon {...props} />;
	}
}
