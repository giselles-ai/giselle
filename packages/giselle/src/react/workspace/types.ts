import type {
	FileData,
	FileNode,
	InputId,
	Node,
	NodeBase,
	NodeId,
	NodeLike,
	NodeUIState,
	OutputId,
	ShortcutScope,
	Viewport,
	Workspace,
} from "@giselle-sdk/data-type";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";

export type ConnectionCloneStrategy = "inputs-only" | "all" | "none";

export interface WorkflowDesignerContextValue {
	data: Workspace;
	textGenerationApi: string;
	addNode: (node: Node, options?: { ui?: NodeUIState }) => void;
	copyNode: (
		sourceNode: Node,
		options?: {
			ui?: NodeUIState;
			connectionCloneStrategy?: ConnectionCloneStrategy;
		},
	) => Promise<Node | undefined> | Node | undefined;
	addConnection: (args: {
		outputNode: NodeLike;
		outputId: OutputId;
		inputNode: NodeLike;
		inputId: InputId;
	}) => void;
	updateNodeData: <T extends NodeBase>(node: T, data: Partial<T>) => void;
	updateNodeDataContent: <T extends Node>(
		node: T,
		content: Partial<T["content"]>,
	) => void;
	setUiNodeState: (
		nodeId: string | NodeId,
		ui: Partial<NodeUIState>,
		options?: { save?: boolean },
	) => void;
	setUiViewport: (viewport: Viewport) => void;
	deleteNode: (nodeId: NodeId | string) => Promise<void> | void;
	deleteConnection: (connectionIdLike: string) => void;
	updateName: (name: string | undefined) => void;
	uploadFile: (
		files: File[],
		node: FileNode,
		options?: { onError?: (message: string) => void },
	) => Promise<void>;
	removeFile: (file: FileData) => Promise<void>;
	llmProviders: LanguageModelProvider[];
	isLoading: boolean;
	saveWorkspace: () => Promise<void>;
	isSupportedConnection: (
		outputNode: NodeLike,
		inputNode: NodeLike,
	) => { canConnect: boolean; message?: string };
	setCurrentShortcutScope: (scope: ShortcutScope) => void;
	copiedNode: NodeLike | null;
	setCopiedNode: (node: NodeLike | null) => void;
}
