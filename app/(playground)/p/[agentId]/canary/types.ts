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

type FileData = UploadingFileData | ProcessingFileData | CompletedFileData;
export interface FileContent extends VariableContentBase {
	type: "file";
	data?: FileData | null | undefined;
}

type VariableContent = TextContent | FileContent;

export interface Text extends Variable {
	content: TextContent;
}
export interface File extends Variable {
	content: FileContent;
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
}
interface TextArtifact extends GeneratedArtifact {
	object: TextArtifactObject;
}
interface TextStreamArtifact extends StreamAtrifact {
	object: TextArtifactObject;
}
export type Artifact = TextArtifact | TextStreamArtifact;

export type GraphId = `grph_${string}`;
export interface Graph {
	id: GraphId;
	nodes: Node[];
	connections: Connection[];
	artifacts: Artifact[];
}

export type Tool = "addTextNode" | "addFileNode" | "addTextGenerationNode";