import { buildDefaultPort, buildNodeClass } from "../../builder";
import { nodeClassCategory, portType } from "../../types";
import { scrapeWebpage } from "./scrape-webpage";

export const webScraping = buildNodeClass("text", {
	categories: [nodeClassCategory.utility],
	defaultPorts: {
		inputPorts: [
			buildDefaultPort({ type: portType.execution, name: "from" }),
			buildDefaultPort({ type: portType.data, name: "url" }),
		],
		outputPorts: [
			buildDefaultPort({ type: portType.execution, name: "to" }),
			buildDefaultPort({ type: portType.data, name: "result" }),
		],
	},
	action: async ({
		requestId,
		requestDbId,
		nodeDbId,
		findDefaultTargetPort,
		findDefaultSourceport,
	}) => {
		await scrapeWebpage({
			requestId,
			requestDbId,
			nodeDbId,
			urlPort: findDefaultTargetPort("url"),
			resultPort: findDefaultSourceport("result"),
		});
	},
});
