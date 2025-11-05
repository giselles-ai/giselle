import type { FileNode } from "@giselles-ai/protocol";

export type FileTypeConfig = {
	accept: string[];
	label: string;
	maxSize?: number;
};

export type FilePanelProps = {
	node: FileNode;
	config: FileTypeConfig;
};
