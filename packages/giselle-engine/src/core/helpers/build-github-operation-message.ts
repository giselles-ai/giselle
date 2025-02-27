import {
	type FileData,
	type GitHubNode,
	type Node,
	NodeId,
	OutputId,
} from "@giselle-sdk/data-type";
import { isJsonContent, jsonContentToText } from "@giselle-sdk/text-editor";
import type { CoreMessage, DataContent, FilePart } from "ai";

// NOTE: almost duplicate of buildGenerationMessageForTextGeneration
// - difference -> this function converts json content to text
export async function buildGenerationMessageForGithubOperation(
	node: GitHubNode,
	contextNodes: Node[],
	fileResolver: (file: FileData) => Promise<DataContent>,
	textGenerationResolver: (nodeId: NodeId) => Promise<string | undefined>,
): Promise<CoreMessage[]> {
	const prompt = node.content.prompt;
	if (prompt === undefined) {
		throw new Error("Prompt cannot be empty");
	}

	// TODO: source format has been changed
	// old: {{nd-<nodeId>:otp-<outputId>}}
	// new: {"type":"Source","attrs":{"node":{"id":"nd-bIIQ8d1zdt4C44Gz","type":"variable","content":{"type":"text"}},"outputId":"otp-p2DriE7CncEwlYyf"}},
	const pattern = /\{\{(nd-[a-zA-Z0-9]+):(otp-[a-zA-Z0-9]+)\}\}/g;
	const sourceKeywords = [...prompt.matchAll(pattern)].map((match) => ({
		nodeId: NodeId.parse(match[1]),
		outputId: OutputId.parse(match[2]),
	}));

	let userMessage = prompt;

	if (isJsonContent(prompt)) {
		userMessage = jsonContentToText(JSON.parse(prompt));
	}
	const attachedFiles: FilePart[] = [];
	for (const sourceKeyword of sourceKeywords) {
		const contextNode = contextNodes.find(
			(contextNode) => contextNode.id === sourceKeyword.nodeId,
		);
		if (contextNode === undefined) {
			continue;
		}
		const replaceKeyword = `{{${sourceKeyword.nodeId}:${sourceKeyword.outputId}}}`;
		console.log("!!!!!!!! replaceKeyword", replaceKeyword);
		switch (contextNode.content.type) {
			case "text": {
				let content = contextNode.content.text;
				console.log("???????? content", content);
				if (isJsonContent(content)) {
					content = jsonContentToText(JSON.parse(content));
				}

				userMessage = userMessage.replace(replaceKeyword, content);
				break;
			}
			case "github":
			case "textGeneration": {
				const result = await textGenerationResolver(contextNode.id);
				if (result !== undefined) {
					userMessage = userMessage.replace(replaceKeyword, result);
				}
				break;
			}
			case "file": {
				switch (contextNode.content.category) {
					case "pdf": {
						const fileContents = await Promise.all(
							contextNode.content.files.map(async (file) => {
								if (file.status !== "uploaded") {
									return null;
								}
								const data = await fileResolver(file);
								return {
									type: "file",
									data,
									mimeType: "application/pdf",
								} satisfies FilePart;
							}),
						).then((results) => results.filter((result) => result !== null));
						if (fileContents.length > 1) {
							userMessage = userMessage.replace(
								replaceKeyword,
								`${getOrdinal(attachedFiles.length + 1)} ~ ${getOrdinal(attachedFiles.length + fileContents.length)} attached files`,
							);
						} else {
							userMessage = userMessage.replace(
								replaceKeyword,
								`${getOrdinal(attachedFiles.length + 1)} attached file`,
							);
						}
						attachedFiles.push(...fileContents);
						break;
					}
					case "text": {
						const fileContents = await Promise.all(
							contextNode.content.files.map(async (file) => {
								if (file.status !== "uploaded") {
									return null;
								}
								const data = await fileResolver(file);
								return {
									type: "file",
									data,
									mimeType: "text/plain",
								} satisfies FilePart;
							}),
						).then((results) => results.filter((result) => result !== null));
						if (fileContents.length > 1) {
							userMessage = userMessage.replace(
								replaceKeyword,
								`${getOrdinal(attachedFiles.length + 1)} ~ ${getOrdinal(attachedFiles.length + fileContents.length)} attached files`,
							);
						} else {
							userMessage = userMessage.replace(
								replaceKeyword,
								`${getOrdinal(attachedFiles.length + 1)} attached file`,
							);
						}
						attachedFiles.push(...fileContents);
						break;
					}
					default: {
						const _exhaustiveCheck: never = contextNode.content.category;
						throw new Error(`Unhandled category: ${_exhaustiveCheck}`);
					}
				}
				break;
			}
			default: {
				const _exhaustiveCheck: never = contextNode.content;
				throw new Error(`Unhandled content type: ${_exhaustiveCheck}`);
			}
		}
	}

	return [
		{
			role: "user",
			content: [
				...attachedFiles,
				{
					type: "text",
					text: userMessage,
				},
			],
		},
	];
}

function getOrdinal(n: number): string {
	const rules = new Intl.PluralRules("en", { type: "ordinal" });
	const suffixes: { [key: string]: string } = {
		one: "st",
		two: "nd",
		few: "rd",
		other: "th",
	};
	const suffix = suffixes[rules.select(n)];
	return `${n}${suffix}`;
}

export default buildGenerationMessageForGithubOperation;
