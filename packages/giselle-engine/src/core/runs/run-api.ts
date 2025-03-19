import {
	type CreatedRun,
	type FileNode,
	GenerationId,
	type GenerationTemplate,
	type GitHubNode,
	type ImageGenerationNode,
	type JobId,
	type OverrideNode,
	type QueuedGeneration,
	RunId,
	type TextGenerationNode,
	type TextNode,
	type WorkflowId,
	type WorkspaceId,
	isOverrideFileContent,
	isOverrideGitHubContent,
	isOverrideImageGenerationContent,
	isOverrideTextContent,
	isOverrideTextGenerationContent,
} from "@giselle-sdk/data-type";
import { generateText } from "../generations";
import type { GiselleEngineContext } from "../types";
import { addRun } from "./add-run";
import { startRun } from "./start-run";

function overrideGenerationTemplate(
	template: GenerationTemplate,
	overrideNodes: OverrideNode[],
) {
	let overridedTemplate = template;
	for (const overrideNode of overrideNodes) {
		if (overrideNode.id === template.actionNode.id) {
			switch (template.actionNode.content.type) {
				case "textGeneration": {
					if (isOverrideTextGenerationContent(overrideNode.content)) {
						overridedTemplate = {
							...overridedTemplate,
							actionNode: {
								...overridedTemplate.actionNode,
								content: {
									...overridedTemplate.actionNode.content,
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
							actionNode: {
								...overridedTemplate.actionNode,
								content: {
									...overridedTemplate.actionNode.content,
									prompt: overrideNode.content.prompt,
								},
							},
						};
					}
					break;
				}
				default: {
					const _exhaustiveCheck: never = template.actionNode.content;
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
				default: {
					const _exhaustiveCheck: never = sourceNode.content;
					throw new Error(`Unhandled source node type: ${_exhaustiveCheck}`);
				}
			}
		}
	}
	return overridedTemplate;
}

export async function runApi(args: {
	workspaceId: WorkspaceId;
	workflowId: WorkflowId;
	context: GiselleEngineContext;
	overrideNodes?: OverrideNode[];
}) {
	const runId = RunId.generate();
	const createdRun = {
		id: runId,
		status: "created",
		createdAt: Date.now(),
	} satisfies CreatedRun;
	const run = await addRun({ ...args, run: createdRun });
	await startRun({
		runId,
		context: args.context,
	});
	const jobResults: Record<JobId, string[]> = {};
	for (const job of run.workflow.jobs) {
		const jobResult = await Promise.all(
			job.actions.map(async (action) => {
				const generationId = GenerationId.generate();
				const generation = {
					id: generationId,
					context: {
						...overrideGenerationTemplate(
							action.generationTemplate,
							args.overrideNodes ?? [],
						),
						origin: { type: "run", id: runId },
					},
					status: "queued",
					createdAt: Date.now(),
					ququedAt: Date.now(),
				} satisfies QueuedGeneration;
				const streamTextResult = await generateText({
					context: args.context,
					generation,
				});
				await streamTextResult.consumeStream();
				return await streamTextResult.text;
			}),
		);
		jobResults[job.id] = jobResult;
	}
	return jobResults[run.workflow.jobs[run.workflow.jobs.length - 1].id].join(
		"/n",
	);
}
