import type { NodeId } from "../node/types";
import type { WorkflowData } from "../node/workflow-state";
import { DependencyResolver } from "./dependency-resolver";
import type { RuntimeConfiguration, WorkflowRunResult } from "./types";
import { TextGenerationRunner } from "./workflow-runners/text-generation-runner";
import type { NodeRunner } from "./workflow-runners/types";

const DEFAULT_CONFIG: Required<RuntimeConfiguration> = {
	maxRetries: 3,
	retryDelay: 1000,
};

export class WorkflowRunnerSystem {
	private runners: NodeRunner[] = [];
	private config: Required<RuntimeConfiguration>;
	private dependencyResolver: DependencyResolver;

	constructor(
		private readonly workflowData: WorkflowData,
		config?: RuntimeConfiguration,
	) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.dependencyResolver = new DependencyResolver(workflowData);

		// Register default runners
		this.runners.push(new TextGenerationRunner());
	}

	async run(): Promise<WorkflowRunResult> {
		const results: WorkflowRunResult["results"] = {};
		try {
			const executionOrder = this.dependencyResolver.getExecutionOrder();

			for (const nodeId of executionOrder) {
				const node = this.workflowData.nodes[nodeId].data;
				const runner = this.runners.find((r) => r.canHandle(node));

				if (!runner) {
					throw new Error(`No runner found for node type: ${node.type}`);
				}

				let retryCount = 0;
				let lastError: Error | undefined;

				while (retryCount <= this.config.maxRetries) {
					try {
						const dependencies = this.getDependencyValues(nodeId, results);
						const output = await runner.run(node, {
							nodeId,
							dependencies,
						});

						results[nodeId] = { nodeId, output, retryCount };
						break;
					} catch (error) {
						// @ts-ignore error is not always an instance of Error
						lastError = error;
						retryCount++;
						if (retryCount <= this.config.maxRetries) {
							await new Promise((resolve) =>
								setTimeout(resolve, this.config.retryDelay),
							);
						}
					}
				}

				if (lastError) {
					results[nodeId] = {
						nodeId,
						output: null,
						error: lastError,
						retryCount,
					};
					throw lastError;
				}
			}

			return {
				success: true,
				results,
			};
		} catch (error) {
			return {
				success: false,
				results,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}

	private getDependencyValues(
		nodeId: NodeId,
		results: WorkflowRunResult["results"],
	): Record<NodeId, unknown> {
		const dependencyActions =
			this.dependencyResolver.getDependencyActions(nodeId);
		const dependencyVariables =
			this.dependencyResolver.getDependencyVariables(nodeId);
		return {
			...Object.fromEntries(
				dependencyVariables.map((depId) => {
					const nodeData = this.workflowData.nodes[depId].data;
					if (nodeData.content.type === "text") {
						return [depId, nodeData.content.text];
					}
					throw new Error(
						`Unsupported variable type: ${nodeData.content.type}`,
					);
				}),
			),
			...Object.fromEntries(
				dependencyActions.map((depId) => [depId, results[depId]?.output]),
			),
		};
	}
}
