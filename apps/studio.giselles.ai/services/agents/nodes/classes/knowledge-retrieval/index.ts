import { buildDefaultPort, buildNodeClass } from "../../builder";
import { nodeClassCategory, portType } from "../../types";
import { createOpenaiAssistant } from "./createOpenaiAssistant";
import { dataSchema } from "./data-schema";
import { retrieval } from "./retrieval";

export const knowledgeRetrieval = buildNodeClass("knowledgeRetrieval", {
	categories: [nodeClassCategory.llm],
	defaultPorts: {
		inputPorts: [
			buildDefaultPort({ type: portType.execution, name: "from" }),
			buildDefaultPort({ type: portType.data, name: "query" }),
		],
		outputPorts: [
			buildDefaultPort({ type: portType.execution, name: "to" }),
			buildDefaultPort({ type: portType.data, name: "result" }),
		],
	},
	dataSchema,
	action: async ({
		data,
		findDefaultTargetPort,
		requestId,
		requestDbId,
		nodeDbId,
		findDefaultSourceport,
	}) => {
		await retrieval({
			openaiAssistantId: data.openaiAssistantId,
			queryPort: findDefaultTargetPort("query"),
			requestId,
			requestDbId,
			resultPort: findDefaultSourceport("result"),
			nodeDbId,
		});
	},
	afterCreate: async ({ nodeDbId, data, nodeGraph }) => {
		await createOpenaiAssistant({
			nodeDbId,
			knowledgeIds: data.knowledgeIds,
			nodeGraph,
		});
	},
});
