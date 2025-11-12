// Re-export types from @giselles-ai/protocol that are used by other modules
// Note: GenerationMetadata is defined in ./types, not in @giselles-ai/protocol
export type {
	ActId,
	CompletedGeneration,
	CancelledGeneration,
	FailedGeneration,
	FileContent,
	FileId,
	Generation,
	GenerationContext,
	GenerationContextInput,
	GenerationId,
	GenerationIndex,
	GenerationOrigin,
	GenerationOutput,
	GenerationStatus,
	GenerationUsage,
	Image,
	ImageGenerationNode,
	Message,
	Node,
	NodeGenerationIndex,
	NodeId,
	OperationNode,
	OutputFileBlob,
	OutputId,
	QueuedGeneration,
	RunningGeneration,
	TextGenerationNode,
	WebPageContent,
	WorkspaceId,
} from "@giselles-ai/protocol";
export {
	Generation,
	GenerationContext,
	GenerationId,
	GenerationOrigin,
	ImageId,
	isCompletedGeneration,
	isCreatedGeneration,
	isFailedGeneration,
	isImageGenerationNode,
	isQueuedGeneration,
	isRunningGeneration,
	isTextGenerationNode,
	NodeGenerationIndex,
} from "@giselles-ai/protocol";
export * from "./cancel-generation";
export * from "./generate-content";
export * from "./generate-image";
export * from "./get-generated-image";
export * from "./get-generation";
export * from "./get-generation-message-chunks";
export * from "./get-node-generations";
export * from "./set-generation";
export * from "./types";
