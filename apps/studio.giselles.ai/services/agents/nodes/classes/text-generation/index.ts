import { buildDefaultPort, buildNodeClass } from "../../builder";
import { nodeClassCategory, portType } from "../../types";
import { generateText } from "./generate-text";

export const textGeneration = buildNodeClass("textGeneration", {
	categories: [nodeClassCategory.llm],
	defaultPorts: {
		inputPorts: [
			buildDefaultPort({ type: portType.execution, name: "from" }),
			buildDefaultPort({ type: portType.data, name: "instruction" }),
		],
		outputPorts: [
			buildDefaultPort({ type: portType.execution, name: "to" }),
			buildDefaultPort({ type: portType.data, name: "result" }),
		],
	},
	action: async ({
		nodeDbId,
		requestId,
		requestDbId,
		findDefaultTargetPort: findDefaultInputPortAsBlueprint,
		findDefaultSourceport: findDefaultOutputPortAsBlueprint,
	}) => {
		const instructionPort = findDefaultInputPortAsBlueprint("instruction");
		const resultPort = findDefaultOutputPortAsBlueprint("result");
		await generateText({
			instructionPort,
			resultPort,
			requestId,
			nodeDbId,
			requestDbId,
		});
	},
});
