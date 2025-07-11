export type NodeId = `nd_${string}`;
interface NodeBase {
	id: NodeId;
	name: string;
	type: string;
	position: Position;
	selected: boolean;
}

interface Position {
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

type ActionContent = TextGenerateActionContent | WebSearchActionContent;

interface Variable extends NodeBase {
	type: "variable";
	content: VariableContent;
}

interface VariableContentBase {
	type: string;
}

interface TextContent extends VariableContentBase {
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

type FileData =
	| UploadingFileData
	| ProcessingFileData
	| CompletedFileData
	| FailedFileData;

/** @deprecated */
interface FileContent extends VariableContentBase {
	type: "file";
	data?: FileData | null | undefined;
}
interface FilesContent extends VariableContentBase {
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
interface NodeHandle {
	id: NodeHandleId;
	label: string;
}

export type Node = Action | Variable;

export type ConnectionId = `cnnc_${string}`;
interface Connection {
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
interface GeneratedArtifact extends ArtifactBase {
	type: "generatedArtifact";
	createdAt: number;
}
interface StreamAtrifact extends ArtifactBase {
	type: "streamArtifact";
}

interface ArtifactObjectBase {
	type: string;
}

interface TextArtifactObject extends ArtifactObjectBase {
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
type Artifact = TextArtifact | TextStreamArtifact;

export type GraphId = `grph_${string}`;
type GraphVersion =
	| "2024-12-09"
	| "2024-12-10"
	| "2024-12-11"
	| "20241212"
	| "20241213"
	| "20241217";

export type LatestGraphVersion = "20241217";
export interface Graph {
	id: GraphId;
	nodes: Node[];
	connections: Connection[];
	artifacts: Artifact[];
	version: GraphVersion;
	flows: Flow[];
	executionIndexes: ExecutionIndex[];
}

export type FlowId = `flw_${string}`;

export type StepId = `stp_${string}`;
interface Step {
	id: StepId;
	nodeId: NodeId;
	variableNodeIds: NodeId[];
}
export type JobId = `jb_${string}`;
interface Job {
	id: JobId;
	steps: Step[];
}
export interface Flow {
	id: FlowId;
	name: string;
	jobs: Job[];
	nodes: NodeId[];
	connections: ConnectionId[];
}

export type AgentId = `agnt_${string}`;

export type StepExecutionId = `stex_${string}`;
interface StepExecutionBase {
	id: StepExecutionId;
	stepId: StepId;
	nodeId: NodeId;
	status: string;
}
interface PendingStepExecution extends StepExecutionBase {
	status: "pending";
}

interface RunningStepExecution extends StepExecutionBase {
	status: "running";
	runStartedAt: number;
}

interface CompletedStepExecution extends StepExecutionBase {
	status: "completed";
	runStartedAt: number;
	durationMs: number;
}

interface FailedStepExecution extends StepExecutionBase {
	status: "failed";
	runStartedAt: number;
	durationMs: number;
	error: string;
}

interface SkippedStepExecution extends StepExecutionBase {
	status: "skipped";
}

type StepExecution =
	| PendingStepExecution
	| RunningStepExecution
	| CompletedStepExecution
	| FailedStepExecution
	| SkippedStepExecution;

export type JobExecutionId = `jbex_${string}`;
interface JobExecutionBase {
	id: JobExecutionId;
	jobId: JobId;
	stepExecutions: StepExecution[];
	status: string;
}
interface PendingJobExecution extends JobExecutionBase {
	status: "pending";
}
interface RunningJobExecution extends JobExecutionBase {
	status: "running";
	runStartedAt: number;
}
interface CompletedJobExecution extends JobExecutionBase {
	status: "completed";
	runStartedAt: number;
	durationMs: number;
}
interface FailedJobExecution extends JobExecutionBase {
	status: "failed";
	runStartedAt: number;
	durationMs: number;
}
interface SkippedJobExecution extends JobExecutionBase {
	status: "skipped";
}
export type JobExecution =
	| PendingJobExecution
	| RunningJobExecution
	| CompletedJobExecution
	| FailedJobExecution
	| SkippedJobExecution;
export type ExecutionId = `exct_${string}`;

interface ExecutionIndex {
	executionId: ExecutionId;
	blobUrl: string;
	completedAt: number;
}

export type GitHubIntegrationSettingId = `gthbs_${string}`;
export interface GitHubEventNodeMapping {
	event: string;
	nodeId: NodeId;
}

export type GitHubRepositoryIndexId = `gthbi_${string}`;
