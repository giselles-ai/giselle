import type { GitHubTriggerEventId } from "@giselle-sdk/flow";
import type { ReactNode } from "react";

interface GitHubTriggerIconProps {
	triggerId: GitHubTriggerEventId;
	className?: string;
}

/**
 * Renders the appropriate icon for a GitHub trigger based on its ID
 */
export function GitHubTriggerIcon({
	triggerId,
	className = "text-white",
}: GitHubTriggerIconProps): ReactNode {
	switch (triggerId) {
		case "github.issue.created":
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 24.79 22.6"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="Issue created"
				>
					<title>Issue created</title>
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

		case "github.issue.closed":
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="Issue closed"
				>
					<title>Issue closed</title>
					<path
						d="M7 12.5L10.5 16L17 9"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			);

		case "github.issue_comment.created":
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 31.24 28.32"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="Issue comment created"
				>
					<title>Issue comment created</title>
					<path
						d="M15.62,0C7.01,0,0,5.5,0,12.26c0,4.53,3.2,8.68,8.23,10.8-.06,1.71-.39,2.21-.47,2.3-.91,1.09-.46,2.06-.06,2.46.33.33.73.5,1.25.5.72,0,1.66-.32,2.96-.97.88-.44,2.56-1.37,4.38-2.85,8.29-.28,14.94-5.68,14.94-12.24S24.23,0,15.62,0ZM15.73,21.51h-.54s-.42.36-.42.36c-1.29,1.09-2.58,1.92-3.63,2.5.09-.69.12-1.48.09-2.38l-.02-1.04-.98-.34c-4.39-1.54-7.23-4.82-7.23-8.35C3,7.15,8.66,3,15.62,3s12.62,4.15,12.62,9.26-5.61,9.21-12.51,9.25Z"
						fill="currentColor"
					/>
					<path
						d="M21.64,8.72h-12.05c-.83,0-1.5.67-1.5,1.5s.67,1.5,1.5,1.5h12.05c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5Z"
						fill="currentColor"
					/>
				</svg>
			);

		case "github.pull_request_comment.created":
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 31.24 28.32"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="Pull request comment created"
				>
					<title>Pull request comment created</title>
					<path
						d="M15.62,0C7.01,0,0,5.5,0,12.26c0,4.53,3.2,8.68,8.23,10.8-.06,1.71-.39,2.21-.47,2.3-.91,1.09-.46,2.06-.06,2.46.33.33.73.5,1.25.5.72,0,1.66-.32,2.96-.97.88-.44,2.56-1.37,4.38-2.85,8.29-.28,14.94-5.68,14.94-12.24S24.23,0,15.62,0ZM15.73,21.51h-.54s-.42.36-.42.36c-1.29,1.09-2.58,1.92-3.63,2.5.09-.69.12-1.48.09-2.38l-.02-1.04-.98-.34c-4.39-1.54-7.23-4.82-7.23-8.35C3,7.15,8.66,3,15.62,3s12.62,4.15,12.62,9.26-5.61,9.21-12.51,9.25Z"
						fill="currentColor"
					/>
					<path
						d="M21.64,8.72h-12.05c-.83,0-1.5.67-1.5,1.5s.67,1.5,1.5,1.5h12.05c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5Z"
						fill="currentColor"
					/>
				</svg>
			);

		case "github.pull_request_review_comment.created":
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 31.24 28.32"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="Pull request review comment created"
				>
					<title>Pull request review comment created</title>
					<path
						d="M15.62,0C7.01,0,0,5.5,0,12.26c0,4.53,3.2,8.68,8.23,10.8-.06,1.71-.39,2.21-.47,2.3-.91,1.09-.46,2.06-.06,2.46.33.33.73.5,1.25.5.72,0,1.66-.32,2.96-.97.88-.44,2.56-1.37,4.38-2.85,8.29-.28,14.94-5.68,14.94-12.24S24.23,0,15.62,0ZM15.73,21.51h-.54s-.42.36-.42.36c-1.29,1.09-2.58,1.92-3.63,2.5.09-.69.12-1.48.09-2.38l-.02-1.04-.98-.34c-4.39-1.54-7.23-4.82-7.23-8.35C3,7.15,8.66,3,15.62,3s12.62,4.15,12.62,9.26-5.61,9.21-12.51,9.25Z"
						fill="currentColor"
					/>
					<path
						d="M19.4,8.66l-4.8,5.1-2.79-2.79c-.59-.59-1.54-.59-2.12,0-.59.58-.59,1.53,0,2.12l3.88,3.89c.28.28.66.44,1.06.44h.02c.41,0,.79-.18,1.07-.47l5.86-6.23c.57-.6.54-1.55-.06-2.12-.6-.57-1.55-.54-2.12.06Z"
						fill="currentColor"
					/>
				</svg>
			);

		case "github.pull_request.opened":
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 28.81 28.68"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="Pull request opened"
				>
					<title>Pull request opened</title>
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

		case "github.pull_request.ready_for_review":
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 28.81 26.63"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="Pull request ready for review"
				>
					<title>Pull request ready for review</title>
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

		case "github.pull_request.closed":
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="Pull request closed"
				>
					<title>Pull request closed</title>
					<path
						d="M7 12.5L10.5 16L17 9"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			);

		default:
			// Default icon for any unhandled trigger types
			return (
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className={className}
					aria-label="GitHub trigger"
				>
					<title>GitHub trigger</title>
					<path
						d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
						fill="currentColor"
					/>
				</svg>
			);
	}
}
