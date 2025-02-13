import { object, parse, string } from "valibot";
import { buildDefaultPort, buildNodeClass } from "../../builder";
import { nodeClassCategory, portType } from "../../types";
import { buildTemplate } from "./build-template";
import { TextNodePanel } from "./ui";

export const text = buildNodeClass("text", {
	categories: [nodeClassCategory.utility],
	defaultPorts: {
		outputPorts: [buildDefaultPort({ type: portType.data, name: "text" })],
	},
	dataSchema: object({
		template: string(),
	}),
	renderPanel: ({ node, data }) => {
		return (
			<TextNodePanel
				node={node}
				textFieldValue={data.template}
				textFieldName="template"
			/>
		);
	},
	resolver: async ({
		requestDbId,
		nodeDbId,
		nodeGraph,
		data,
		findDefaultSourceport: findDefaultOutputPortAsBlueprint,
	}) => {
		const textPort = findDefaultOutputPortAsBlueprint("text");
		await buildTemplate({
			requestDbId,
			nodeDbId,
			template: data.template,
			inputPorts: nodeGraph.ports,
			outputPortId: textPort.id,
		});
	},
});
