export type NodeId = `nd_${string}`;
interface NodeBase {
	id: NodeId;
	name: string;
	type: string;
	position: Position;
	selected: boolean;
}

export interface Position {
	x: number;
	y: number;
}

interface Action extends NodeBase {
	type: "action";
	content: ActionContent;
}
interface ActionContentBase {
	type: string;
}
export interface TextGenerateActionContent extends ActionContentBase {
	type: "textGeneration";
	llm: `${string}:${string}`;
	temperature: number;
	topP: number;
	instruction: string;
	requirement?: NodeHandle;
	system?: string;
	sources: NodeHandle[];
}
export interface TextGeneration extends Action {
	content: TextGenerateActionContent;
}
interface WebSearchActionContent extends ActionContentBase {
	type: "webSearch";
}
export interface WebSearch extends Action {
	content: WebSearchActionContent;
}
type ActionContent = TextGenerateActionContent | WebSearchActionContent;

interface Variable extends NodeBase {
	type: "variable";
	content: VariableContent;
}

interface VariableContentBase {
	type: string;
}

export interface TextContent extends VariableContentBase {
	type: "text";
	text: string;
}
export type FileId = `fl_${string}`;
interface FileDataBase {
	id: FileId;
	name: string;
	contentType: string;
	size: number;
	status: string;
}
interface UploadingFileData extends FileDataBase {
	status: "uploading";
}

interface ProcessingFileData extends FileDataBase {
	status: "processing";
	uploadedAt: number;
	fileBlobUrl: string;
}

interface CompletedFileData extends FileDataBase {
	status: "completed";
	uploadedAt: number;
	fileBlobUrl: string;
	processedAt: number;
	textDataUrl: string;
}
interface FailedFileData extends FileDataBase {
	status: "failed";
}

export type FileData =
	| UploadingFileData
	| ProcessingFileData
	| CompletedFileData
	| FailedFileData;

/** @deprecated */
export interface FileContent extends VariableContentBase {
	type: "file";
	data?: FileData | null | undefined;
}
export interface FilesContent extends VariableContentBase {
	type: "files";
	data: FileData[];
}

type VariableContent = TextContent | FileContent | FilesContent;

export interface Text extends Variable {
	content: TextContent;
}
export interface File extends Variable {
	content: FileContent;
}
export interface Files extends Variable {
	content: FilesContent;
}

export type NodeHandleId = `ndh_${string}`;
export interface NodeHandle {
	id: NodeHandleId;
	label: string;
}

export type Node = Action | Variable;

export type ConnectionId = `cnnc_${string}`;
export interface Connection {
	id: ConnectionId;
	sourceNodeId: NodeId;
	sourceNodeHandleId?: NodeHandleId;
	sourceNodeType: Node["type"];
	targetNodeId: NodeId;
	targetNodeHandleId?: NodeHandleId;
	targetNodeType: Node["type"];
}

export type ArtifactId = `artf_${string}`;
interface ArtifactBase {
	id: ArtifactId;
	type: string;
	creatorNodeId: NodeId;
	object: ArtifactObjectBase;
}
export interface GeneratedArtifact extends ArtifactBase {
	type: "generatedArtifact";
	createdAt: number;
}
interface StreamAtrifact extends ArtifactBase {
	type: "streamArtifact";
}

interface ArtifactObjectBase {
	type: string;
}

export interface TextArtifactObject extends ArtifactObjectBase {
	type: "text";
	title: string;
	content: string;
	messages: {
		plan: string;
		description: string;
	};
	usage?: {
		// unavailable until generation is completed
		promptTokens: number;
		completionTokens: number;
	};
}
interface TextArtifact extends GeneratedArtifact {
	object: TextArtifactObject;
}
interface TextStreamArtifact extends StreamAtrifact {
	object: TextArtifactObject;
}
export type Artifact = TextArtifact | TextStreamArtifact;

export type GraphId = `grph_${string}`;
type GraphVersion = "2024-12-09" | "2024-12-10";
export type LatestGraphVersion = "2024-12-10";
export interface Graph {
	id: GraphId;
	nodes: Node[];
	connections: Connection[];
	artifacts: Artifact[];
	version: GraphVersion;
	subGraphs: SubGraph[];
}

interface ToolBase {
	category: string;
	action: string;
}

interface AddTextNodeTool extends ToolBase {
	category: "edit";
	action: "addTextNode";
}
interface AddFileNodeTool extends ToolBase {
	category: "edit";
	action: "addFileNode";
}
interface AddTextGenerationNodeTool extends ToolBase {
	category: "edit";
	action: "addTextGenerationNode";
}
interface MoveTool extends ToolBase {
	category: "move";
	action: "move";
}
export type Tool =
	| AddTextNodeTool
	| AddFileNodeTool
	| AddTextGenerationNodeTool
	| MoveTool;

export type SubGraphId = `sbgrph_${string}`;

export interface SubGraph {
	id: SubGraphId;
	name: string;
	nodes: Set<NodeId>;
	connections: Set<ConnectionId>;
}

export type AgentId = `agnt_${string}`;
