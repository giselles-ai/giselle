import type { Connection, Node } from "./types";

const outlineNode: Node = {
	id: "nd_outline",
	name: "Untitled Node - 1",
	position: { x: 332.3, y: 277.5 },
	type: "action",
	content: {
		type: "textGeneration",
		llm: "gpt2",
		temperature: 0.7,
		topP: 1,
		instruction: "Write a short story about a cat",
		sources: [
			{
				id: "ndh_source1",
				label: "Source1",
			},
			{
				id: "ndh_source2",
				label: "Source2",
			},
		],
	},
};

const sectionNode1: Node = {
	id: "nd_section1",
	name: "Untitled Node - 2",
	position: { x: 600, y: 275.0 },
	type: "action",
	content: {
		type: "textGeneration",
		llm: "gpt2",
		temperature: 0.7,
		topP: 1,
		instruction: "Write a short story about a cat",
		requirement: { id: "ndh_requirement", label: "Requirement" },
		sources: [
			{
				id: "ndh_source1",
				label: "Source1",
			},
			{
				id: "ndh_source2",
				label: "Source2",
			},
			{
				id: "ndh_source3",
				label: "Source3",
			},
		],
	},
};

const sectionNode2: Node = {
	id: "nd_section2",
	name: "Untitled Node - 3",
	position: { x: 600, y: 600 },
	type: "action",
	content: {
		type: "textGeneration",
		llm: "gpt2",
		temperature: 0.7,
		topP: 1,
		instruction: "Write a short story about a cat",
		requirement: { id: "ndh_requirement", label: "Requirement" },
		sources: [
			{
				id: "ndh_source1",
				label: "Source1",
			},
			{
				id: "ndh_source2",
				label: "Source2",
			},
			{
				id: "ndh_source3",
				label: "Source3",
			},
		],
	},
};

const concatNode: Node = {
	id: "nd_concat",
	name: "Untitled Node - 4",
	position: { x: 900, y: 300 },
	type: "action",
	content: {
		type: "textGeneration",
		llm: "gpt2",
		temperature: 0.7,
		topP: 1,
		instruction: "Write a short story about a cat",
		sources: [
			{
				id: "ndh_source1",
				label: "Source1",
			},
			{
				id: "ndh_source2",
				label: "Source2",
			},
		],
	},
};

const reviewNode: Node = {
	id: "nd_review",
	name: "Untitled Node - 5",
	position: { x: 1150, y: 100 },
	type: "action",
	content: {
		type: "textGeneration",
		llm: "gpt2",
		temperature: 0.7,
		topP: 1,
		instruction: "Write a short story about a cat",
		sources: [
			{
				id: "ndh_source1",
				label: "Source1",
			},
			{
				id: "ndh_source2",
				label: "Source2",
			},
			{
				id: "ndh_source3",
				label: "Source3",
			},
		],
	},
};

const fileNode: Node = {
	id: "nd_file",
	name: "Untitled Node - 6",
	position: { x: -15, y: 100 },
	type: "variable",
	content: {
		type: "file",
	},
};

const textNode: Node = {
	id: "nd_text",
	name: "Untitled Node - 7",
	position: { x: -15, y: 300 },
	type: "variable",
	content: {
		type: "text",
		text: `Analyze the following git diff and generate a clear, concise commit message that follows these rules:

1. Start with a type prefix in parentheses, choosing from:
   - (feat): New feature
   - (fix): Bug fix
   - (docs): Documentation changes
   - (style): Code style changes (formatting, etc)
   - (refactor): Code refactoring
   - (perf): Performance improvements
   - (test): Adding or modifying tests
   - (chore): Maintenance tasks

2. Follow with a short (50 chars or less) summary in imperative mood
3. Add a blank line followed by more detailed description if needed
4. Break description into bullet points for multiple changes
5. Reference any issue numbers at the end

Here is the diff to analyze:

{diff_text}

Generate a commit message following the above format and these additional guidelines:
- Be specific about what changed, but concise
- Use imperative mood ("Add feature" not "Added feature")
- Focus on the "what" and "why", not "how"
- Mention significant implementation details only if important
- Include breaking changes prominently if any`,
	},
};

const webSearchNode: Node = {
	id: "nd_web-search",
	name: "Untitled Node - 8",
	position: { x: -15, y: 478 },
	type: "action",
	content: {
		type: "webSearch",
	},
};

const textGenerationStandAloneNode: Node = {
	id: "nd_stand-alone",
	name: "Untitled Node - 9",
	position: { x: 600, y: 100 },
	type: "action",
	content: {
		type: "textGeneration",
		llm: "gpt2",
		temperature: 0.7,
		topP: 1,
		instruction: "Write a short story about a cat",
		sources: [],
	},
};

export const nodes = [
	outlineNode,
	sectionNode1,
	sectionNode2,
	concatNode,
	reviewNode,
	fileNode,
	textNode,
	webSearchNode,
	textGenerationStandAloneNode,
];

const fileOutlineConnection: Connection = {
	id: "cnnc_file-outline",
	sourceNodeId: fileNode.id,
	sourceNodeType: "variable",
	targetNodeId: outlineNode.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source1",
};

const fileSection1Connection: Connection = {
	id: "cnnc_file-section1",
	sourceNodeId: fileNode.id,
	sourceNodeType: "variable",
	targetNodeId: sectionNode1.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source1",
};
const fileSection2Connection: Connection = {
	id: "cnnc_file-section2",
	sourceNodeId: fileNode.id,
	sourceNodeType: "variable",
	targetNodeId: sectionNode2.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source1",
};

const fileReviewConnection: Connection = {
	id: "cnnc_file-review",
	sourceNodeId: fileNode.id,
	sourceNodeType: "variable",
	targetNodeId: reviewNode.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source1",
};

const textSection1Connection: Connection = {
	id: "cnnc_text-section1",
	sourceNodeId: textNode.id,
	sourceNodeType: "variable",
	targetNodeId: sectionNode1.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_requirement",
};

const textSection2Connection: Connection = {
	id: "cnnc_text-section2",
	sourceNodeId: textNode.id,
	sourceNodeType: "variable",
	targetNodeId: sectionNode2.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_requirement",
};

const outlineToSection1Connection: Connection = {
	id: "cnnc_outline-section1",
	sourceNodeId: outlineNode.id,
	sourceNodeType: "action",
	targetNodeId: sectionNode1.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source2",
};

const outlineToSection2Connection: Connection = {
	id: "cnnc_outline-section2",
	sourceNodeId: outlineNode.id,
	sourceNodeType: "action",
	targetNodeId: sectionNode2.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source2",
};
const section1ToConcatConnection: Connection = {
	id: "cnnc_section1-concat",
	sourceNodeId: sectionNode1.id,
	sourceNodeType: "action",
	targetNodeId: concatNode.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source1",
};
const section2ToConcatConnection: Connection = {
	id: "cnnc_section2-concat",
	sourceNodeId: sectionNode2.id,
	sourceNodeType: "action",
	targetNodeId: concatNode.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source2",
};
const concatToReviewConnection: Connection = {
	id: "cnnc_concat-review",
	sourceNodeId: concatNode.id,
	sourceNodeType: "action",
	targetNodeId: reviewNode.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source2",
};

const webSearchToOutlineConnection: Connection = {
	id: "cnnc_web-search-outline",
	sourceNodeId: webSearchNode.id,
	sourceNodeType: "action",
	targetNodeId: outlineNode.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source2",
};
const webSearchToSection1Connection: Connection = {
	id: "cnnc_web-search-section1",
	sourceNodeId: webSearchNode.id,
	sourceNodeType: "action",
	targetNodeId: sectionNode1.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source3",
};
const webSearchToSection2Connection: Connection = {
	id: "cnnc_web-search-section2",
	sourceNodeId: webSearchNode.id,
	sourceNodeType: "action",
	targetNodeId: sectionNode2.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source3",
};
const webSearchToReviewConnection: Connection = {
	id: "cnnc_web-search-review",
	sourceNodeId: webSearchNode.id,
	sourceNodeType: "action",
	targetNodeId: reviewNode.id,
	targetNodeType: "action",
	targetNodeHandleId: "ndh_source3",
};

export const connections = [
	fileOutlineConnection,
	fileSection1Connection,
	fileSection2Connection,
	fileReviewConnection,
	textSection1Connection,
	textSection2Connection,
	outlineToSection1Connection,
	outlineToSection2Connection,
	section1ToConcatConnection,
	section2ToConcatConnection,
	concatToReviewConnection,
	webSearchToOutlineConnection,
	webSearchToSection1Connection,
	webSearchToSection2Connection,
	webSearchToReviewConnection,
];