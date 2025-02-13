import { buildDefaultPort, buildNodeClass } from "../../builder";
import { nodeClassCategory, portType } from "../../types";
import { insertRequestResult } from "./insert-request-result";

export const response = buildNodeClass("response", {
	categories: [nodeClassCategory.response],
	defaultPorts: {
		inputPorts: [
			buildDefaultPort({ type: portType.execution, name: "from" }),
			buildDefaultPort({ type: portType.data, name: "output" }),
		],
	},
	action: async ({ requestDbId, nodeDbId, findDefaultTargetPort }) => {
		await insertRequestResult({
			requestDbId,
			nodeDbId,
			outputPort: findDefaultTargetPort("output"),
		});
	},
});
