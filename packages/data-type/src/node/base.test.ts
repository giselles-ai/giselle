import { expect, test } from "vitest";
import { Node } from ".";

test("should parse operation node with required inputs correctly", () => {
	const parse = Node.safeParse({
		id: "nd-HgwthAQztKwwJzQ9",
		name: "Create Issue Comment",
		type: "operation",
		inputs: [
			{
				id: "inp-NnAVaRCdioDX0Jnb",
				label: "body",
				isRequired: true,
				accessor: "body",
			},
		],
		outputs: [],
		content: {
			type: "action",
			command: {
				provider: "github",
				state: {
					status: "configured",
					commandId: "github.create.issueComment",
					installationId: 65591132,
					repositoryNodeId: "R_kgDONFn3Nw",
				},
			},
		},
	});
	expect(parse.success).toBeTruthy();
	if (parse.success) {
		expect(parse.data.inputs[0].isRequired).toBe(true);
	}
});
