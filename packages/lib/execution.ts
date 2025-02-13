"use server";

import { agents, db, subscriptions, teams } from "@/drizzle";

import {
	createLogger,
	waitForTelemetryExport,
	withTokenMeasurement,
} from "@/lib/opentelemetry";
import { isAgentTimeAvailable } from "@/services/agents/activities";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { toJsonSchema } from "@valibot/to-json-schema";
import { waitUntil } from "@vercel/functions";
import {
	type LanguageModelV1,
	generateObject,
	jsonSchema,
	streamObject,
} from "ai";
import { createStreamableValue } from "ai/rsc";
import { MockLanguageModelV1, simulateReadableStream } from "ai/test";
import { and, eq } from "drizzle-orm";
import HandleBars from "handlebars";
import Langfuse from "langfuse";
import * as v from "valibot";
import type {
	AgentId,
	Artifact,
	Connection,
	ExecuteActionReturnValue,
	ExecutionId,
	ExecutionSnapshot,
	FlowId,
	Graph,
	Node,
	NodeHandle,
	NodeHandleId,
	NodeId,
	StepId,
	TextArtifactObject,
	TextGenerateActionContent,
} from "../types";
import {
	AgentTimeNotAvailableError,
	FileNotReadyError,
	UserDisplayableServerActionError,
} from "./errors";
import { textGenerationPrompt } from "./prompts";
import { langfuseModel, toErrorWithMessage } from "./utils";

function resolveLanguageModel(
	llm: TextGenerateActionContent["llm"],
): LanguageModelV1 {
	const [provider, model] = llm.split(":");
	if (provider === "openai") {
		return openai(model);
	}
	if (provider === "anthropic") {
		return anthropic(model);
	}
	if (provider === "google") {
		return google(model);
	}
	if (provider === "dev") {
		return new MockLanguageModelV1({
			defaultObjectGenerationMode: "json",
			doStream: async () => ({
				stream: simulateReadableStream({
					chunks: [{ type: "error", error: "a" }],
				}),
				rawCall: { rawPrompt: null, rawSettings: {} },
			}),
		});
	}
	throw new Error("Unsupported model provider");
}

function nodeResolver(nodeHandleId: NodeHandleId, context: ExecutionContext) {
	const connection = context.connections.find(
		(connection) => connection.targetNodeHandleId === nodeHandleId,
	);
	const node = context.nodes.find(
		(node) => node.id === connection?.sourceNodeId,
	);
	if (node === undefined) {
		return null;
	}
	return node;
}

function artifactResolver(
	artifactCreatorNodeId: NodeId,
	context: ExecutionContext,
) {
	const generatedArtifact = context.artifacts.find(
		(artifact) => artifact.creatorNodeId === artifactCreatorNodeId,
	);
	if (
		generatedArtifact === undefined ||
		generatedArtifact.type !== "generatedArtifact"
	) {
		return null;
	}
	return generatedArtifact;
}

const artifactSchema = v.object({
	plan: v.pipe(
		v.string(),
		v.description(
			"How you think about the content of the artefact (purpose, structure, essentials) and how you intend to output it",
		),
	),
	title: v.pipe(v.string(), v.description("The title of the artefact")),
	content: v.pipe(
		v.string(),
		v.description("The content of the artefact formatted markdown."),
	),
	description: v.pipe(
		v.string(),
		v.description(
			"Explanation of the Artifact and what the intention was in creating this Artifact. Add any suggestions for making it even better.",
		),
	),
});

type ArtifactResolver = (artifactCreatorNodeId: NodeId) => Artifact | null;
type NodeResolver = (nodeHandleId: NodeHandleId) => Node | null;
interface SourceResolver {
	nodeResolver: NodeResolver;
	artifactResolver: ArtifactResolver;
}

interface ExecutionSourceBase {
	type: string;
	nodeId: NodeId;
}

interface TextSource extends ExecutionSourceBase {
	type: "text";
	content: string;
}
interface FileSource extends ExecutionSourceBase {
	type: "file";
	title: string;
	content: string;
}
interface TextGenerationSource extends ExecutionSourceBase {
	type: "textGeneration";
	title: string;
	content: string;
}

type ExecutionSource = TextSource | TextGenerationSource | FileSource;
async function resolveSources(
	sources: NodeHandle[],
	context: ExecutionContext,
) {
	return Promise.all(
		sources.map(async (source) => {
			const node = nodeResolver(source.id, context);
			switch (node?.content.type) {
				case "text":
					return {
						type: "text",
						content: node.content.text,
						nodeId: node.id,
					} satisfies ExecutionSource;
				case "file": {
					if (node.content.data == null) {
						throw new Error("File not found");
					}
					if (node.content.data.status === "uploading") {
						throw new FileNotReadyError("File is uploading");
					}
					if (node.content.data.status === "processing") {
						throw new FileNotReadyError("File is processing");
					}
					if (node.content.data.status === "failed") {
						return null;
					}
					const text = await fetch(node.content.data.textDataUrl).then((res) =>
						res.text(),
					);
					return {
						type: "file",
						title: node.content.data.name,
						content: text,
						nodeId: node.id,
					} satisfies ExecutionSource;
				}

				case "files": {
					return await Promise.all(
						node.content.data.map(async (file) => {
							if (file == null) {
								throw new Error("File not found");
							}
							if (file.status === "uploading") {
								throw new FileNotReadyError("File is uploading");
							}
							if (file.status === "processing") {
								throw new FileNotReadyError("File is processing");
							}
							if (file.status === "failed") {
								return null;
							}
							const text = await fetch(file.textDataUrl).then((res) =>
								res.text(),
							);
							return {
								type: "file",
								title: file.name,
								content: text,
								nodeId: node.id,
							} satisfies ExecutionSource;
						}),
					);
				}
				case "textGeneration": {
					const generatedArtifact = artifactResolver(node.id, context);
					if (
						generatedArtifact === null ||
						generatedArtifact.type !== "generatedArtifact"
					) {
						return null;
					}
					return {
						type: "textGeneration",
						title: generatedArtifact.object.title,
						content: generatedArtifact.object.content,
						nodeId: node.id,
					} satisfies ExecutionSource;
				}
				default:
					return null;
			}
		}),
	).then((sources) => sources.filter((source) => source !== null).flat());
}

function resolveRequirement(
	requirement: NodeHandle | null,
	context: ExecutionContext,
) {
	if (requirement === null) {
		return null;
	}
	const node = nodeResolver(requirement.id, context);
	switch (node?.content.type) {
		case "text":
			return node.content.text;
		case "textGeneration": {
			const generatedArtifact = artifactResolver(node.id, context);
			if (
				generatedArtifact === null ||
				generatedArtifact.type === "generatedArtifact"
			) {
				return null;
			}
			return generatedArtifact.object.content;
		}
		default:
			return null;
	}
}

interface ExecutionContext {
	agentId: AgentId;
	executionId: ExecutionId;
	node: Node;
	artifacts: Artifact[];
	nodes: Node[];
	connections: Connection[];
	stream?: boolean;
}

async function performFlowExecution(
	context: ExecutionContext,
): Promise<ExecuteActionReturnValue> {
	const canPerform = await canPerformFlowExecution(context.agentId);
	if (!canPerform) {
		throw new AgentTimeNotAvailableError();
	}
	const startTime = Date.now();
	const lf = new Langfuse();
	const trace = lf.trace({
		sessionId: context.executionId,
	});
	const node = context.node;

	switch (node.content.type) {
		case "textGeneration": {
			const actionSources = await resolveSources(node.content.sources, context);
			const requirement = resolveRequirement(
				node.content.requirement ?? null,
				context,
			);
			const model = resolveLanguageModel(node.content.llm);
			const promptTemplate = HandleBars.compile(
				node.content.system ?? textGenerationPrompt,
			);
			const prompt = promptTemplate({
				instruction: node.content.instruction,
				requirement,
				sources: actionSources,
			});
			const topP = node.content.topP;
			const temperature = node.content.temperature;

			trace.update({
				input: prompt,
			});

			const generationTracer = trace.generation({
				name: "generate-text",
				input: prompt,
				model: langfuseModel(node.content.llm),
				modelParameters: {
					topP: node.content.topP,
					temperature: node.content.temperature,
				},
			});

			if (context.stream) {
				const streamableValue = createStreamableValue<TextArtifactObject>();
				(async () => {
					const { partialObjectStream, object, usage } = streamObject({
						model,
						prompt,
						schema: jsonSchema<v.InferInput<typeof artifactSchema>>(
							toJsonSchema(artifactSchema),
						),
						topP,
						temperature,
					});

					for await (const partialObject of partialObjectStream) {
						streamableValue.update({
							type: "text",
							title: partialObject.title ?? "",
							content: partialObject.content ?? "",
							messages: {
								plan: partialObject.plan ?? "",
								description: partialObject.description ?? "",
							},
						});
					}

					const result = await object;
					await withTokenMeasurement(
						createLogger(node.content.type),
						async () => {
							generationTracer.end({ output: result });
							trace.update({ output: result });
							await lf.shutdownAsync();
							waitForTelemetryExport();
							return { usage: await usage };
						},
						model,
						context.agentId,
						startTime,
					);
					streamableValue.done();
				})().catch((error) => {
					generationTracer.update({
						level: "ERROR",
						statusMessage: toErrorWithMessage(error).message,
					});
					streamableValue.error(error);
				});

				return streamableValue.value;
			}
			const { usage, object } = await generateObject({
				model,
				prompt,
				schema: jsonSchema<v.InferInput<typeof artifactSchema>>(
					toJsonSchema(artifactSchema),
				),
				topP,
				temperature,
			});
			waitUntil(
				withTokenMeasurement(
					createLogger(node.content.type),
					async () => {
						generationTracer.end({ output: object });
						trace.update({ output: object });
						await lf.shutdownAsync();
						waitForTelemetryExport();
						return { usage };
					},
					model,
					context.agentId,
					startTime,
				),
			);
			return {
				type: "text",
				title: object.title,
				content: object.content,
				messages: {
					plan: object.plan,
					description: object.description,
				},
			} satisfies TextArtifactObject;
		}
		default:
			throw new Error("Invalid node type");
	}
}

interface OverrideData {
	nodeId: NodeId;
	data: string;
}
interface ExecuteStepParams {
	agentId: AgentId;
	flowId: FlowId;
	executionId: ExecutionId;
	stepId: StepId;
	artifacts: Artifact[];
	stream?: boolean;
	overrideData?: OverrideData[];
}
export async function executeStep({
	agentId,
	flowId,
	executionId,
	stepId,
	artifacts,
	stream,
	overrideData,
}: ExecuteStepParams) {
	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.id, agentId),
	});

	if (agent === undefined || agent.graphUrl === null) {
		throw new Error(`Agent with id ${agentId} not found`);
	}

	const graph = await fetch(agent.graphUrl).then(
		(res) => res.json() as unknown as Graph,
	);

	const flow = graph.flows.find((flow) => flow.id === flowId);
	if (flow === undefined) {
		throw new Error(`Flow with id ${flowId} not found`);
	}

	const step = flow.jobs
		.flatMap((job) => job.steps)
		.find((step) => step.id === stepId);

	if (step === undefined) {
		throw new Error(`Step with id ${stepId} not found`);
	}
	const nodes = applyOverrides(graph.nodes, overrideData);
	const executionNode = nodes.find((node) => node.id === step.nodeId);
	if (executionNode === undefined) {
		throw new Error("Node not found");
	}

	const context: ExecutionContext = {
		agentId,
		executionId,
		node: executionNode,
		artifacts,
		nodes,
		connections: graph.connections,
		stream,
	};

	return performFlowExecution(context);
}

interface RetryStepParams {
	agentId: AgentId;
	retryExecutionSnapshotUrl: string;
	executionId: ExecutionId;
	stepId: StepId;
	artifacts: Artifact[];
	stream?: boolean;
}
export async function retryStep({
	agentId,
	retryExecutionSnapshotUrl,
	executionId,
	stepId,
	artifacts,
	stream,
}: RetryStepParams) {
	const executionSnapshot = await fetch(retryExecutionSnapshotUrl).then(
		(res) => res.json() as unknown as ExecutionSnapshot,
	);

	const step = executionSnapshot.flow.jobs
		.flatMap((job) => job.steps)
		.find((step) => step.id === stepId);

	if (step === undefined) {
		throw new Error(`Step with id ${stepId} not found`);
	}

	const node = executionSnapshot.nodes.find((node) => node.id === step.nodeId);
	if (node === undefined) {
		throw new Error("Node not found");
	}

	const context: ExecutionContext = {
		agentId,
		executionId,
		node,
		artifacts,
		nodes: executionSnapshot.nodes,
		connections: executionSnapshot.connections,
		stream,
	};

	return performFlowExecution(context);
}

interface ExecuteNodeParams {
	agentId: AgentId;
	executionId: ExecutionId;
	nodeId: NodeId;
	stream?: boolean;
}
export async function executeNode({
	agentId,
	executionId,
	nodeId,
	stream,
}: ExecuteNodeParams) {
	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.id, agentId),
	});

	if (agent === undefined || agent.graphUrl === null) {
		throw new Error(`Agent with id ${agentId} not found`);
	}

	const graph = await fetch(agent.graphUrl).then(
		(res) => res.json() as unknown as Graph,
	);

	const node = graph.nodes.find((node) => node.id === nodeId);
	if (node === undefined) {
		throw new Error("Node not found");
	}

	const context: ExecutionContext = {
		agentId,
		executionId,
		node,
		artifacts: graph.artifacts,
		nodes: graph.nodes,
		connections: graph.connections,
		stream,
	};

	return performFlowExecution(context);
}

async function canPerformFlowExecution(agentId: AgentId) {
	const res = await db
		.select({
			id: teams.id,
			dbId: teams.dbId,
			name: teams.name,
			type: teams.type,
			activeSubscriptionId: subscriptions.id,
		})
		.from(teams)
		.innerJoin(agents, eq(agents.teamDbId, teams.dbId))
		.leftJoin(
			subscriptions,
			and(
				eq(subscriptions.teamDbId, teams.dbId),
				eq(subscriptions.status, "active"),
			),
		)
		.where(eq(agents.id, agentId));
	if (res.length === 0) {
		throw new Error(`Agent with id ${agentId} not found`);
	}
	if (res.length > 1) {
		throw new Error(`Agent with id ${agentId} is in multiple teams`);
	}

	const team = res[0];
	return await isAgentTimeAvailable(team);
}

function applyOverrides(nodes: Node[], overrideData?: OverrideData[]) {
	if (overrideData == null) {
		return nodes;
	}

	const overrideDataMap = new Map(
		overrideData.map(({ nodeId, data }) => [nodeId, data]) ?? [],
	);
	return nodes.map((node) => {
		const override = overrideDataMap.get(node.id);
		if (override == null) {
			return node;
		}
		switch (node.content.type) {
			case "textGeneration":
				return {
					...node,
					content: {
						...node.content,
						instruction: override,
					},
				} as Node;
			case "text":
				return {
					...node,
					content: {
						...node.content,
						text: override,
					},
				} as Node;
			default:
				throw new Error(`Unsupported override type: ${node.content.type}`);
		}
	});
}

export type ExecuteAgentActionResult =
	| {
			status: "success";
			result: ExecuteActionReturnValue;
	  }
	| {
			status: "error";
			message: string;
	  };

// In production builds, server-side exceptions are hidden from the client for security reasons.
// However, we sometimes need to display specific error messages to users (e.g. "Please upgrade your plan").
// This wrapper ensures that:
// 1. UserDisplayableServerActionErrors are safely passed to the client with their messages intact
// 2. Other errors are masked with a generic "Unknown error" message
// 3. Successful results are properly formatted with the expected type
export async function wrapAgentExecutionServerAction(
	fn: () => Promise<ExecuteActionReturnValue>,
): Promise<ExecuteAgentActionResult> {
	"use server";

	try {
		const result = await fn();
		return { status: "success", result };
	} catch (error) {
		if (error instanceof UserDisplayableServerActionError) {
			return { status: "error", message: error.message };
		}
		throw new Error("Unknown error");
	}
}
