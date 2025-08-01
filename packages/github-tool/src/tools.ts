import type { Octokit } from "@octokit/core";
import { tool } from "ai";
import { z } from "zod";

export function githubTools(octokit: Octokit) {
	return {
		addIssueComment: tool({
			description: "Add a comment to an existing issue",
			inputSchema: z.object({
				body: z.string().describe("Comment content"),
				issueNumber: z.number().describe("Issue number to comment on"),
				owner: z.string().describe("Repository owner"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { body, issueNumber, owner, repo } = params;
				const response = await octokit.request(
					"POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
					{
						owner,
						repo,
						issue_number: issueNumber,
						body,
					},
				);
				return response.data;
			},
		}),
		addPullRequestReviewComment: tool({
			description: "Add a review comment to a pull request",
			inputSchema: z.object({
				body: z.string().describe("The text of the review comment"),
				commitId: z
					.string()
					.describe(
						"The SHA of the commit to comment on. Required unless in_reply_to is specified.",
					)
					.optional(),
				inReplyTo: z
					.number()
					.describe(
						"The ID of the review comment to reply to. When specified, only body is required and all other parameters are ignored",
					)
					.optional(),
				line: z
					.number()
					.describe(
						"The line of the blob in the pull request diff that the comment applies to. For multi-line comments, the last line of the range",
					)
					.optional(),
				owner: z.string().describe("Repository owner"),
				path: z
					.string()
					.describe(
						"The relative path to the file that necessitates a comment. Required unless in_reply_to is specified.",
					)
					.optional(),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
				side: z.enum(["LEFT", "RIGHT"]).optional(),
				startLine: z
					.number()
					.describe(
						"For multi-line comments, the first line of the range that the comment applies to",
					)
					.optional(),
				startSide: z.enum(["LEFT", "RIGHT"]).optional(),
				subjectType: z.enum(["line", "file"]).optional(),
			}),
			execute: async (params) => {
				const {
					body,
					commitId,
					inReplyTo,
					line,
					owner,
					path,
					pullNumber,
					repo,
					side,
					startLine,
					startSide,
					subjectType,
				} = params;

				if (inReplyTo) {
					// Reply to an existing comment
					const response = await octokit.request(
						"POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
						{
							owner,
							repo,
							pull_number: pullNumber,
							comment_id: inReplyTo,
							body,
						},
					);
					return response.data;
				}

				if (commitId === undefined) {
					return "No commit ID provided";
				}
				if (path === undefined) {
					return "No path provided";
				}
				// Create a new comment
				const response = await octokit.request(
					"POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
					{
						owner,
						repo,
						pull_number: pullNumber,
						body,
						commit_id: commitId,
						path,
						line,
						side,
						start_line: startLine,
						start_side: startSide,
						subject_type: subjectType,
					},
				);
				return response.data;
			},
		}),
		createBranch: tool({
			description: "Create a new branch in a GitHub repository",
			inputSchema: z.object({
				branch: z.string().describe("Name for new branch"),
				fromBranch: z
					.string()
					.describe("Source branch (defaults to repo default)")
					.optional(),
				owner: z.string().describe("Repository owner"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { branch, fromBranch, owner, repo } = params;

				// Get the SHA for the source branch
				const sourceBranch = fromBranch || (await getDefaultBranch());
				const { data: refData } = await octokit.request(
					"GET /repos/{owner}/{repo}/git/ref/heads/{branch}",
					{
						owner,
						repo,
						branch: sourceBranch,
					},
				);

				// Create the new branch
				const response = await octokit.request(
					"POST /repos/{owner}/{repo}/git/refs",
					{
						owner,
						repo,
						ref: `refs/heads/${branch}`,
						sha: refData.object.sha,
					},
				);

				return response.data;

				// Helper function to get default branch
				async function getDefaultBranch() {
					const { data: repoData } = await octokit.request(
						"GET /repos/{owner}/{repo}",
						{
							owner,
							repo,
						},
					);
					return repoData.default_branch;
				}
			},
		}),
		createIssue: tool({
			description: "Create a new issue in a GitHub repository",
			inputSchema: z.object({
				assignees: z
					.array(z.string())
					.describe("Usernames to assign to this issue")
					.optional(),
				body: z.string().describe("Issue body content").optional(),
				labels: z
					.array(z.string())
					.describe("Labels to apply to this issue")
					.optional(),
				milestone: z.number().describe("Milestone number").optional(),
				owner: z.string().describe("Repository owner"),
				repo: z.string().describe("Repository name"),
				title: z.string().describe("Issue title"),
			}),
			execute: async (params) => {
				const { assignees, body, labels, milestone, owner, repo, title } =
					params;
				const response = await octokit.request(
					"POST /repos/{owner}/{repo}/issues",
					{
						owner,
						repo,
						title,
						body,
						assignees,
						labels,
						milestone,
					},
				);
				return response.data;
			},
		}),
		createOrUpdateFile: tool({
			description: "Create or update a single file in a GitHub repository",
			inputSchema: z.object({
				branch: z.string().describe("Branch to create/update the file in"),
				content: z.string().describe("Content of the file"),
				message: z.string().describe("Commit message"),
				owner: z
					.string()
					.describe("Repository owner (username or organization)"),
				path: z.string().describe("Path where to create/update the file"),
				repo: z.string().describe("Repository name"),
				sha: z
					.string()
					.describe("SHA of file being replaced (for updates)")
					.optional(),
			}),
			execute: async (params) => {
				const { branch, content, message, owner, path, repo, sha } = params;

				// Convert content to base64
				const contentBase64 = Buffer.from(content).toString("base64");

				const response = await octokit.request(
					"PUT /repos/{owner}/{repo}/contents/{path}",
					{
						owner,
						repo,
						path,
						message,
						content: contentBase64,
						branch,
						sha,
					},
				);

				return response.data;
			},
		}),
		createPullRequest: tool({
			description: "Create a new pull request in a GitHub repository",
			inputSchema: z.object({
				base: z.string().describe("Branch to merge into"),
				body: z.string().describe("PR description").optional(),
				draft: z.boolean().describe("Create as draft PR").optional(),
				head: z.string().describe("Branch containing changes"),
				maintainerCanModify: z
					.boolean()
					.describe("Allow maintainer edits")
					.optional(),
				owner: z.string().describe("Repository owner"),
				repo: z.string().describe("Repository name"),
				title: z.string().describe("PR title"),
			}),
			execute: async (params) => {
				const {
					base,
					body,
					draft,
					head,
					maintainerCanModify,
					owner,
					repo,
					title,
				} = params;

				const response = await octokit.request(
					"POST /repos/{owner}/{repo}/pulls",
					{
						owner,
						repo,
						title,
						body,
						head,
						base,
						draft: draft || false,
						maintainer_can_modify: maintainerCanModify,
					},
				);

				return response.data;
			},
		}),
		createPullRequestReview: tool({
			description: "Create a review on a pull request",
			inputSchema: z.object({
				body: z.string().describe("Review comment text").optional(),
				comments: z
					.array(z.any())
					.describe(
						"Line-specific comments array of objects to place comments on pull request changes. Requires path and body. For line comments use line or position. For multi-line comments use start_line and line with optional side parameters.",
					)
					.optional(),
				commitId: z.string().describe("SHA of commit to review").optional(),
				event: z
					.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"])
					.describe("Review action ('APPROVE', 'REQUEST_CHANGES', 'COMMENT')"),
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { body, comments, commitId, event, owner, pullNumber, repo } =
					params;

				const response = await octokit.request(
					"POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
					{
						owner,
						repo,
						pull_number: pullNumber,
						commit_id: commitId,
						body,
						event,
						comments,
					},
				);

				return response.data;
			},
		}),
		createRepository: tool({
			description: "Create a new GitHub repository in your account",
			inputSchema: z.object({
				autoInit: z.boolean().describe("Initialize with README").optional(),
				description: z.string().describe("Repository description").optional(),
				name: z.string().describe("Repository name"),
				private: z
					.boolean()
					.describe("Whether repo should be private")
					.optional(),
			}),
			execute: async (params) => {
				const { autoInit, description, name, private: isPrivate } = params;

				const response = await octokit.request("POST /user/repos", {
					name,
					description,
					private: isPrivate,
					auto_init: autoInit,
				});

				return response.data;
			},
		}),
		forkRepository: tool({
			description:
				"Fork a GitHub repository to your account or specified organization",
			inputSchema: z.object({
				organization: z.string().describe("Organization to fork to").optional(),
				owner: z.string().describe("Repository owner"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { organization, owner, repo } = params;

				const response = await octokit.request(
					"POST /repos/{owner}/{repo}/forks",
					{
						owner,
						repo,
						organization,
					},
				);

				return response.data;
			},
		}),
		getCodeScanningAlert: tool({
			description:
				"Get details of a specific code scanning alert in a GitHub repository.",
			inputSchema: z.object({
				alertNumber: z.number().describe("The number of the alert."),
				owner: z.string().describe("The owner of the repository."),
				repo: z.string().describe("The name of the repository."),
			}),
			execute: async (params) => {
				const { alertNumber, owner, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
					{
						owner,
						repo,
						alert_number: alertNumber,
					},
				);

				return response.data;
			},
		}),
		getCommit: tool({
			description: "Get details for a commit from a GitHub repository",
			inputSchema: z.object({
				owner: z.string().describe("Repository owner"),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				repo: z.string().describe("Repository name"),
				sha: z.string().describe("Commit SHA, branch name, or tag name"),
			}),
			execute: async (params) => {
				const { owner, page, perPage, repo, sha } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/commits/{ref}",
					{
						owner,
						repo,
						ref: sha,
						page,
						per_page: perPage,
					},
				);

				return response.data;
			},
		}),
		getFileContents: tool({
			description:
				"Get the contents of a file or directory from a GitHub repository",
			inputSchema: z.object({
				branch: z.string().describe("Branch to get contents from").optional(),
				owner: z
					.string()
					.describe("Repository owner (username or organization)"),
				path: z.string().describe("Path to file/directory"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { branch, owner, path, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/contents/{path}",
					{
						owner,
						repo,
						path,
						ref: branch,
					},
				);

				return response.data;
			},
		}),
		getIssue: tool({
			description: "Get details of a specific issue in a GitHub repository",
			inputSchema: z.object({
				issueNumber: z.number().describe("The number of the issue"),
				owner: z.string().describe("The owner of the repository"),
				repo: z.string().describe("The name of the repository"),
			}),
			execute: async (params) => {
				const { issueNumber, owner, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/issues/{issue_number}",
					{
						owner,
						repo,
						issue_number: issueNumber,
					},
				);

				return response.data;
			},
		}),
		getIssueComments: tool({
			description: "Get comments for a GitHub issue",
			inputSchema: z.object({
				issueNumber: z.number().describe("Issue number"),
				owner: z.string().describe("Repository owner"),
				page: z.number().describe("Page number").optional(),
				perPage: z.number().describe("Number of records per page").optional(),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { issueNumber, owner, page, perPage, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
					{
						owner,
						repo,
						issue_number: issueNumber,
						page,
						per_page: perPage,
					},
				);

				return response.data;
			},
		}),
		getMe: tool({
			description:
				'Get details of the authenticated GitHub user. Use this when a request include "me", "my"...',
			inputSchema: z.object({
				reason: z
					.string()
					.describe("Optional: reason the session was created")
					.optional(),
			}),
			execute: async (_params) => {
				const response = await octokit.request("GET /user");
				return response.data;
			},
		}),
		getPullRequest: tool({
			description: "Get details of a specific pull request",
			inputSchema: z.object({
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { owner, pullNumber, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/pulls/{pull_number}",
					{
						owner,
						repo,
						pull_number: pullNumber,
					},
				);

				return response.data;
			},
		}),
		getPullRequestComments: tool({
			description: "Get the review comments on a pull request",
			inputSchema: z.object({
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { owner, pullNumber, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
					{
						owner,
						repo,
						pull_number: pullNumber,
					},
				);

				return response.data;
			},
		}),
		getPullRequestFiles: tool({
			description: "Get the list of files changed in a pull request",
			inputSchema: z.object({
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { owner, pullNumber, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
					{
						owner,
						repo,
						pull_number: pullNumber,
					},
				);

				return response.data;
			},
		}),
		getPullRequestReviews: tool({
			description: "Get the reviews on a pull request",
			inputSchema: z.object({
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { owner, pullNumber, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
					{
						owner,
						repo,
						pull_number: pullNumber,
					},
				);

				return response.data;
			},
		}),
		getPullRequestStatus: tool({
			description:
				"Get the combined status of all status checks for a pull request",
			inputSchema: z.object({
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { owner, pullNumber, repo } = params;

				// First get the PR to get the head sha
				const prResponse = await octokit.request(
					"GET /repos/{owner}/{repo}/pulls/{pull_number}",
					{
						owner,
						repo,
						pull_number: pullNumber,
					},
				);

				const sha = prResponse.data.head.sha;

				// Then get the combined status
				const statusResponse = await octokit.request(
					"GET /repos/{owner}/{repo}/commits/{ref}/status",
					{
						owner,
						repo,
						ref: sha,
					},
				);

				return statusResponse.data;
			},
		}),
		listBranches: tool({
			description: "List branches in a GitHub repository",
			inputSchema: z.object({
				owner: z.string().describe("Repository owner"),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { owner, page, perPage, repo } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/branches",
					{
						owner,
						repo,
						page,
						per_page: perPage,
					},
				);

				return response.data;
			},
		}),
		listCodeScanningAlerts: tool({
			description: "List code scanning alerts in a GitHub repository.",
			inputSchema: z.object({
				owner: z.string().describe("The owner of the repository."),
				ref: z
					.string()
					.describe("The Git reference for the results you want to list.")
					.optional(),
				repo: z.string().describe("The name of the repository."),
				severity: z
					.enum([
						"critical",
						"high",
						"medium",
						"low",
						"warning",
						"note",
						"error",
					])
					.optional(),
				state: z.enum(["open", "dismissed", "fixed"]).optional(),
				toolName: z
					.string()
					.describe("The name of the tool used for code scanning.")
					.optional(),
			}),
			execute: async (params) => {
				const { owner, ref, repo, severity, state } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/code-scanning/alerts",
					{
						owner,
						repo,
						ref,
						severity,
						state,
					},
				);

				return response.data;
			},
		}),
		listCommits: tool({
			description: "Get list of commits of a branch in a GitHub repository",
			inputSchema: z.object({
				owner: z.string().describe("Repository owner"),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				repo: z.string().describe("Repository name"),
				sha: z.string().describe("SHA or Branch name").optional(),
			}),
			execute: async (params) => {
				const { owner, page, perPage, repo, sha } = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/commits",
					{
						owner,
						repo,
						sha,
						page,
						per_page: perPage,
					},
				);

				return response.data;
			},
		}),
		listIssues: tool({
			description: "List issues in a GitHub repository with filtering options",
			inputSchema: z.object({
				direction: z.enum(["asc", "desc"]).optional(),
				labels: z.array(z.string()).describe("Filter by labels").optional(),
				owner: z.string().describe("Repository owner"),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				repo: z.string().describe("Repository name"),
				since: z
					.string()
					.describe("Filter by date (ISO 8601 timestamp)")
					.optional(),
				sort: z.enum(["created", "updated", "comments"]).optional(),
				state: z.enum(["open", "closed", "all"]).optional(),
			}),
			execute: async (params) => {
				const {
					direction,
					labels,
					owner,
					page,
					perPage,
					repo,
					since,
					sort,
					state,
				} = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/issues",
					{
						owner,
						repo,
						direction,
						labels: labels?.join(","),
						page,
						per_page: perPage,
						since,
						sort,
						state,
					},
				);

				return response.data;
			},
		}),
		listPullRequests: tool({
			description: "List and filter repository pull requests",
			inputSchema: z.object({
				base: z.string().describe("Filter by base branch").optional(),
				direction: z.enum(["asc", "desc"]).optional(),
				head: z
					.string()
					.describe("Filter by head user/org and branch")
					.optional(),
				owner: z.string().describe("Repository owner"),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				repo: z.string().describe("Repository name"),
				sort: z
					.enum(["created", "updated", "popularity", "long-running"])
					.optional(),
				state: z.enum(["open", "closed", "all"]).optional(),
			}),
			execute: async (params) => {
				const {
					base,
					direction,
					head,
					owner,
					page,
					perPage,
					repo,
					sort,
					state,
				} = params;

				const response = await octokit.request(
					"GET /repos/{owner}/{repo}/pulls",
					{
						owner,
						repo,
						base,
						direction,
						head,
						page,
						per_page: perPage,
						sort,
						state,
					},
				);

				return response.data;
			},
		}),
		mergePullRequest: tool({
			description: "Merge a pull request",
			inputSchema: z.object({
				commitMessage: z
					.string()
					.describe("Extra detail for merge commit")
					.optional(),
				commitTitle: z.string().describe("Title for merge commit").optional(),
				mergeMethod: z.enum(["merge", "squash", "rebase"]).optional(),
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const {
					commitMessage,
					commitTitle,
					mergeMethod,
					owner,
					pullNumber,
					repo,
				} = params;

				const response = await octokit.request(
					"PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge",
					{
						owner,
						repo,
						pull_number: pullNumber,
						commit_message: commitMessage,
						commit_title: commitTitle,
						merge_method: mergeMethod,
					},
				);

				return response.data;
			},
		}),
		// pushFiles: tool({
		// 	description:
		// 		"Push multiple files to a GitHub repository in a single commit",
		// 	parameters: z.object({
		// 		branch: z.string().describe("Branch to push to"),
		// 		files: z
		// 			.array(z.any())
		// 			.describe(
		// 				"Array of file objects to push, each object with path (string) and content (string)",
		// 			),
		// 		message: z.string().describe("Commit message"),
		// 		owner: z.string().describe("Repository owner"),
		// 		repo: z.string().describe("Repository name"),
		// 	}),
		// 	execute: async (params) => {
		// 		const { branch, files, message, owner, repo } = params;

		// 		// Get the current commit SHA for the branch
		// 		const { data: refData } = await octokit.request(
		// 			"GET /repos/{owner}/{repo}/git/ref/heads/{branch}",
		// 			{
		// 				owner,
		// 				repo,
		// 				branch,
		// 			},
		// 		);
		// 		const latestCommitSha = refData.object.sha;

		// 		// Get the tree associated with that commit
		// 		const { data: commitData } = await octokit.request(
		// 			"GET /repos/{owner}/{repo}/git/commits/{commit_sha}",
		// 			{
		// 				owner,
		// 				repo,
		// 				commit_sha: latestCommitSha,
		// 			},
		// 		);
		// 		const baseTreeSha = commitData.tree.sha;

		// 		// Create blobs for each file
		// 		const fileBlobs = await Promise.all(
		// 			files.map(async (file) => {
		// 				const { data: blob } = await octokit.request(
		// 					"POST /repos/{owner}/{repo}/git/blobs",
		// 					{
		// 						owner,
		// 						repo,
		// 						content:
		// 							typeof file.content === "string"
		// 								? file.content
		// 								: JSON.stringify(file.content),
		// 						encoding: "utf-8",
		// 					},
		// 				);
		// 				return {
		// 					path: file.path,
		// 					mode: "100644",
		// 					type: "blob",
		// 					sha: blob.sha,
		// 				};
		// 			}),
		// 		);

		// 		// Create a new tree
		// 		const { data: newTree } = await octokit.request(
		// 			"POST /repos/{owner}/{repo}/git/trees",
		// 			{
		// 				owner,
		// 				repo,
		// 				base_tree: baseTreeSha,
		// 				tree: fileBlobs,
		// 			},
		// 		);

		// 		// Create a new commit
		// 		const { data: newCommit } = await octokit.request(
		// 			"POST /repos/{owner}/{repo}/git/commits",
		// 			{
		// 				owner,
		// 				repo,
		// 				message,
		// 				tree: newTree.sha,
		// 				parents: [latestCommitSha],
		// 			},
		// 		);

		// 		// Update the reference
		// 		const { data: updatedRef } = await octokit.request(
		// 			"PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}",
		// 			{
		// 				owner,
		// 				repo,
		// 				branch,
		// 				sha: newCommit.sha,
		// 				force: false,
		// 			},
		// 		);

		// 		return {
		// 			commit: newCommit,
		// 			reference: updatedRef,
		// 		};
		// 	},
		// }),
		searchCode: tool({
			description: "Search for code across GitHub repositories",
			inputSchema: z.object({
				order: z.enum(["asc", "desc"]).optional(),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				q: z.string().describe("Search query using GitHub code search syntax"),
				sort: z
					.enum(["indexed"])
					.describe("Sort field ('indexed' only)")
					.optional(),
			}),
			execute: async (params) => {
				const { order, page, perPage, q, sort } = params;

				const response = await octokit.request("GET /search/code", {
					q,
					sort,
					order,
					page,
					per_page: perPage,
				});

				return response.data;
			},
		}),
		searchIssues: tool({
			description:
				"Search for issues and pull requests across GitHub repositories",
			inputSchema: z.object({
				order: z.enum(["asc", "desc"]).optional(),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				q: z
					.string()
					.describe("Search query using GitHub issues search syntax"),
				sort: z
					.enum([
						"comments",
						"reactions",
						"reactions-+1",
						"reactions--1",
						"reactions-smile",
						"reactions-thinking_face",
						"reactions-heart",
						"reactions-tada",
						"interactions",
						"created",
						"updated",
					])
					.optional(),
			}),
			execute: async (params) => {
				const { order, page, perPage, q, sort } = params;

				const response = await octokit.request("GET /search/issues", {
					q,
					sort,
					order,
					page,
					per_page: perPage,
					advanced_search: "true",
				});

				return response.data;
			},
		}),
		searchPullRequests: tool({
			description: "Search for pull requests across GitHub repositories",
			inputSchema: z.object({
				order: z.enum(["asc", "desc"]).optional(),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				q: z
					.string()
					.describe("Search query using GitHub issues search syntax"),
				sort: z
					.enum([
						"comments",
						"reactions",
						"reactions-+1",
						"reactions--1",
						"reactions-smile",
						"reactions-thinking_face",
						"reactions-heart",
						"reactions-tada",
						"interactions",
						"created",
						"updated",
					])
					.optional(),
			}),
			execute: async (params) => {
				const { order, page, perPage, q, sort } = params;

				const response = await octokit.request("GET /search/issues", {
					q: `${q} type:pr`,
					sort,
					order,
					page,
					per_page: perPage,
					advanced_search: "true",
				});

				return response.data;
			},
		}),
		searchRepositories: tool({
			description: "Search for GitHub repositories",
			inputSchema: z.object({
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				query: z.string().describe("Search query"),
			}),
			execute: async (params) => {
				const { page, perPage, query } = params;

				const response = await octokit.request("GET /search/repositories", {
					q: query,
					page,
					per_page: perPage,
				});

				return response.data;
			},
		}),
		searchUsers: tool({
			description: "Search for GitHub users",
			inputSchema: z.object({
				order: z.enum(["asc", "desc"]).optional(),
				page: z
					.number()
					.describe("Page number for pagination (min 1)")
					.min(1)
					.optional(),
				perPage: z
					.number()
					.describe("Results per page for pagination (min 1, max 100)")
					.min(1)
					.max(100)
					.optional(),
				q: z.string().describe("Search query using GitHub users search syntax"),
				sort: z.enum(["followers", "repositories", "joined"]).optional(),
			}),
			execute: async (params) => {
				const { order, page, perPage, q, sort } = params;

				const response = await octokit.request("GET /search/users", {
					q,
					sort,
					order,
					page,
					per_page: perPage,
				});

				return response.data;
			},
		}),
		updateIssue: tool({
			description: "Update an existing issue in a GitHub repository",
			inputSchema: z.object({
				assignees: z.array(z.string()).describe("New assignees").optional(),
				body: z.string().describe("New description").optional(),
				issueNumber: z.number().describe("Issue number to update"),
				labels: z.array(z.string()).describe("New labels").optional(),
				milestone: z.number().describe("New milestone number").optional(),
				owner: z.string().describe("Repository owner"),
				repo: z.string().describe("Repository name"),
				state: z.enum(["open", "closed"]).optional(),
				title: z.string().describe("New title").optional(),
			}),
			execute: async (params) => {
				const {
					assignees,
					body,
					issueNumber,
					labels,
					milestone,
					owner,
					repo,
					state,
					title,
				} = params;

				const response = await octokit.request(
					"PATCH /repos/{owner}/{repo}/issues/{issue_number}",
					{
						owner,
						repo,
						issue_number: issueNumber,
						title,
						body,
						assignees,
						labels,
						milestone,
						state,
					},
				);

				return response.data;
			},
		}),
		updatePullRequest: tool({
			description: "Update an existing pull request in a GitHub repository",
			inputSchema: z.object({
				base: z.string().describe("New base branch name").optional(),
				body: z.string().describe("New description").optional(),
				maintainerCanModify: z
					.boolean()
					.describe("Allow maintainer edits")
					.optional(),
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number to update"),
				repo: z.string().describe("Repository name"),
				state: z.enum(["open", "closed"]).optional(),
				title: z.string().describe("New title").optional(),
			}),
			execute: async (params) => {
				const {
					base,
					body,
					maintainerCanModify,
					owner,
					pullNumber,
					repo,
					state,
					title,
				} = params;

				const response = await octokit.request(
					"PATCH /repos/{owner}/{repo}/pulls/{pull_number}",
					{
						owner,
						repo,
						pull_number: pullNumber,
						title,
						body,
						state,
						base,
						maintainer_can_modify: maintainerCanModify,
					},
				);

				return response.data;
			},
		}),
		updatePullRequestBranch: tool({
			description:
				"Update a pull request branch with the latest changes from the base branch",
			inputSchema: z.object({
				expectedHeadSha: z
					.string()
					.describe("The expected SHA of the pull request's HEAD ref")
					.optional(),
				owner: z.string().describe("Repository owner"),
				pullNumber: z.number().describe("Pull request number"),
				repo: z.string().describe("Repository name"),
			}),
			execute: async (params) => {
				const { expectedHeadSha, owner, pullNumber, repo } = params;

				const response = await octokit.request(
					"PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch",
					{
						owner,
						repo,
						pull_number: pullNumber,
						expected_head_sha: expectedHeadSha,
					},
				);

				return response.data;
			},
		}),
	} as const;
}
