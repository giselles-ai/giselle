import type { FileNode } from "@giselle-sdk/data-type";

export type FileTypeConfig = {
	accept: string[];
	label: string;
	maxSize?: number;
};

export type FilePanelProps = {
	node: FileNode;
	config: FileTypeConfig;
};
