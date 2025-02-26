import {
	type CompletedGeneration,
	type FailedGeneration,
	type GitHubContent,
	type RunningGeneration,
	isGitHubNode,
} from "@giselle-sdk/data-type";
import { appendResponseMessages } from "ai";
import type { z } from "zod";
import {
	getGeneration,
	setGeneration,
	setNodeGenerationIndex,
} from "../helpers";
import { githubOperation } from "../schema";
import type { GiselleEngineHandlerArgs } from "./types";

const Input = githubOperation.Input;
type Input = z.infer<typeof Input>;

export async function githubOperationHandler({
	unsafeInput,
	context,
}: GiselleEngineHandlerArgs<Input>) {
	const input = Input.parse(unsafeInput);
	const generation = await getGeneration({
		generationId: input.generationId,
		storage: context.storage,
	});

	if (generation?.status !== "requested") {
		throw new Error("Generation not requested");
	}

	const runningGeneration = {
		...generation,
		status: "running",
		messages: [],
		startedAt: Date.now(),
	} satisfies RunningGeneration;

	if (!isGitHubNode(runningGeneration.context.actionNode)) {
		throw new Error("Action node is not a GitHub node");
	}

	await Promise.all([
		setGeneration({
			storage: context.storage,
			generation: runningGeneration,
		}),
		setNodeGenerationIndex({
			storage: context.storage,
			nodeId: runningGeneration.context.actionNode.id,
			origin: runningGeneration.context.origin,
			nodeGenerationIndex: {
				id: runningGeneration.id,
				nodeId: runningGeneration.context.actionNode.id,
				status: "running",
				createdAt: runningGeneration.createdAt,
				ququedAt: runningGeneration.ququedAt,
				requestedAt: runningGeneration.requestedAt,
				startedAt: runningGeneration.startedAt,
			},
		}),
	]);

	try {
		const githubContent = runningGeneration.context.actionNode.content;

		// Execute GitHub operation
		const { result, details } = await executeGitHubOperation(githubContent);

		const messages = appendResponseMessages({
			messages: [
				{
					id: "id",
					role: "user",
					content: "",
				},
			],
			responseMessages: [
				{
					id: "id",
					role: "assistant",
					content: `${result}${details ? `\n\n## Operation Details\n${details}` : ""}`,
				},
			],
		});

		// Create completed generation
		const completedGeneration = {
			...runningGeneration,
			status: "completed",
			completedAt: Date.now(),
			messages,
		} satisfies CompletedGeneration;

		await Promise.all([
			setGeneration({
				storage: context.storage,
				generation: completedGeneration,
			}),
			setNodeGenerationIndex({
				storage: context.storage,
				nodeId: runningGeneration.context.actionNode.id,
				origin: runningGeneration.context.origin,
				nodeGenerationIndex: {
					id: completedGeneration.id,
					nodeId: completedGeneration.context.actionNode.id,
					status: "completed",
					createdAt: completedGeneration.createdAt,
					ququedAt: completedGeneration.ququedAt,
					requestedAt: completedGeneration.requestedAt,
					startedAt: completedGeneration.startedAt,
					completedAt: completedGeneration.completedAt,
				},
			}),
		]);

		// Return result
		return {
			messages: completedGeneration.messages,
		};
	} catch (error: unknown) {
		const failedGeneration = {
			...runningGeneration,
			status: "failed",
			failedAt: Date.now(),
			error: {
				name: error instanceof Error ? error.name : "Error",
				message:
					error instanceof Error ? error.message : "GitHub operation failed",
				dump: error,
			},
		} satisfies FailedGeneration;

		await Promise.all([
			setGeneration({
				storage: context.storage,
				generation: failedGeneration,
			}),
			setNodeGenerationIndex({
				storage: context.storage,
				nodeId: runningGeneration.context.actionNode.id,
				origin: runningGeneration.context.origin,
				nodeGenerationIndex: {
					id: failedGeneration.id,
					nodeId: failedGeneration.context.actionNode.id,
					status: "failed",
					createdAt: failedGeneration.createdAt,
					ququedAt: failedGeneration.ququedAt,
					requestedAt: failedGeneration.requestedAt,
					startedAt: failedGeneration.startedAt,
					failedAt: failedGeneration.failedAt,
				},
			}),
		]);

		throw error;
	}
}

/**
 * Execute GitHub operation and return the result
 */
async function executeGitHubOperation(githubContent: GitHubContent) {
	// Stub implementation
	return {
		result: `GitHub operation completed: ${githubContent.prompt || "operation"}`,
		details: `
- Repository: ${githubContent.type === "github" ? "GitHub" : "Not specified"}
- Operation type: ${githubContent.prompt ? "Execute prompt" : "Not specified"}
- Status: Success
- Execution time: ${new Date().toISOString()}
		`,
	};
}
