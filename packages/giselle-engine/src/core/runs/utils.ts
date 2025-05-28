import { parseAndMod } from "@giselle-sdk/data-mod";
import {
	type FileNode,
	type GenerationTemplate,
	type GitHubNode,
	type ImageGenerationNode,
	type OverrideNode,
	Run,
	type RunId,
	type TextGenerationNode,
	type TextNode,
	type WorkflowId,
	type WorkspaceId,
	isOverrideFileContent,
	isOverrideGitHubContent,
	isOverrideImageGenerationContent,
	isOverrideQueryContent,
	isOverrideTextContent,
	isOverrideTextGenerationContent,
} from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { getWorkspace } from "../workspaces/utils";

export function runPath(runId: RunId) {
	return `runs/${runId}/run.json`;
}

export async function setRun({
	storage,
	run,
}: {
	storage: Storage;
	run: Run;
}) {
	switch (run.status) {
		case "queued":
			return await storage.set(runPath(run.id), Run.parse(run), {
				// Disable caching by setting cacheControlMaxAge to 0 for Vercel Blob storage
				cacheControlMaxAge: 0,
			});
	}
}

export async function getRun({
	storage,
	runId,
}: {
	storage: Storage;
	runId: RunId;
}): Promise<Run | undefined> {
	const run = await storage.get(runPath(runId));
	if (run == null) {
		return undefined;
	}
	return parseAndMod(Run, run);
}

export async function getWorkflow({
	storage,
	workspaceId,
	workflowId,
	retryAttempts = 5,
	initialDelay = 1000,
	maxDelay = 10000,
}: {
	storage: Storage;
	workspaceId: WorkspaceId;
	workflowId: WorkflowId;
	retryAttempts?: number;
	initialDelay?: number;
	maxDelay?: number;
}) {
	let currentAttempt = 0;
	let currentDelay = initialDelay;

	while (currentAttempt <= retryAttempts) {
		try {
			const workspace = await getWorkspace({
				storage,
				workspaceId,
			});

			if (workspace === undefined) {
				throw new Error("Workspace not found");
			}

			const workflow = workspace.editingWorkflows.find(
				(editingWorkflow) => editingWorkflow.id === workflowId,
			);

			if (workflow === undefined) {
				throw new Error("Workflow not found");
			}

			return workflow;
		} catch (error) {
			currentAttempt++;

			if (currentAttempt > retryAttempts) {
				throw error;
			}

			// Exponential backoff with jitter
			const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 randomization
			currentDelay = Math.min(currentDelay * 2 * jitter, maxDelay);

			// Wait before next attempt
			await new Promise((resolve) => setTimeout(resolve, currentDelay));
		}
	}
	throw new Error("Workflow not found");
}

export function overrideGenerationTemplate(
	template: GenerationTemplate,
	overrideNodes: OverrideNode[],
): GenerationTemplate {
	let overridedTemplate = template;
	for (const overrideNode of overrideNodes) {
		if (overrideNode.id === template.operationNode.id) {
			switch (overridedTemplate.operationNode.content.type) {
				case "textGeneration": {
					if (isOverrideTextGenerationContent(overrideNode.content)) {
						overridedTemplate = {
							...overridedTemplate,
							operationNode: {
								...overridedTemplate.operationNode,
								content: {
									...overridedTemplate.operationNode.content,
									prompt: overrideNode.content.prompt,
								},
							},
						};
					}
					break;
				}
				case "imageGeneration": {
					if (isOverrideImageGenerationContent(overrideNode.content)) {
						overridedTemplate = {
							...overridedTemplate,
							operationNode: {
								...overridedTemplate.operationNode,
								content: {
									...overridedTemplate.operationNode.content,
									prompt: overrideNode.content.prompt,
								},
							},
						};
					}
					break;
				}
				case "query": {
					if (isOverrideQueryContent(overrideNode.content)) {
						overridedTemplate = {
							...overridedTemplate,
							operationNode: {
								...overridedTemplate.operationNode,
								content: {
									...overridedTemplate.operationNode.content,
									query: overrideNode.content.query,
								},
							},
						};
					}
					break;
				}
				case "trigger":
				case "action":
					break;
				default: {
					const _exhaustiveCheck: never =
						overridedTemplate.operationNode.content;
					throw new Error(`Unhandled action node type: ${_exhaustiveCheck}`);
				}
			}
		}
		for (const sourceNode of template.sourceNodes) {
			if (overrideNode.id !== sourceNode.id) {
				continue;
			}
			switch (sourceNode.content.type) {
				case "textGeneration": {
					overridedTemplate = {
						...overridedTemplate,
						sourceNodes: overridedTemplate.sourceNodes.map((node) => {
							if (
								node.id === sourceNode.id &&
								isOverrideTextGenerationContent(overrideNode.content)
							) {
								return {
									...node,
									content: {
										...node.content,
										prompt: overrideNode.content.prompt,
									},
								} as TextGenerationNode;
							}
							return node;
						}),
					};
					break;
				}
				case "imageGeneration":
					overridedTemplate = {
						...overridedTemplate,
						sourceNodes: overridedTemplate.sourceNodes.map((node) => {
							if (
								node.id === sourceNode.id &&
								isOverrideImageGenerationContent(overrideNode.content)
							) {
								return {
									...node,
									content: {
										...node.content,
										prompt: overrideNode.content.prompt,
									},
								} as ImageGenerationNode;
							}
							return node;
						}),
					};
					break;
				case "file":
					overridedTemplate = {
						...overridedTemplate,
						sourceNodes: overridedTemplate.sourceNodes.map((node) => {
							if (
								node.id === sourceNode.id &&
								isOverrideFileContent(overrideNode.content)
							) {
								return {
									...node,
									content: {
										...node.content,
										files: overrideNode.content.files,
									},
								} as FileNode;
							}
							return node;
						}),
					};
					break;
				case "text":
					overridedTemplate = {
						...overridedTemplate,
						sourceNodes: overridedTemplate.sourceNodes.map((node) => {
							if (
								node.id === sourceNode.id &&
								isOverrideTextContent(overrideNode.content)
							) {
								return {
									...node,
									content: {
										...node.content,
										text: overrideNode.content.text,
									},
								} as TextNode;
							}
							return node;
						}),
					};
					break;
				case "github":
					overridedTemplate = {
						...overridedTemplate,
						sourceNodes: overridedTemplate.sourceNodes.map((node) => {
							if (
								node.id === sourceNode.id &&
								isOverrideGitHubContent(overrideNode.content)
							) {
								return {
									...node,
									content: {
										...node.content,
										objectReferences: overrideNode.content.objectReferences,
									},
								} as GitHubNode;
							}
							return node;
						}),
					};
					break;
				case "trigger":
				case "action":
				case "vectorStore":
				case "query":
					break;
				default: {
					const _exhaustiveCheck: never = sourceNode.content;
					throw new Error(`Unhandled source node type: ${_exhaustiveCheck}`);
				}
			}
		}
	}
	return overridedTemplate;
}
