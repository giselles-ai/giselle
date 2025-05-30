export interface Position {
	x: number;
	y: number;
}

export interface ContextMenuState extends Position {
	nodeId: string;
}

export interface ContextMenuContentProps extends Position {
	onDuplicate: () => void;
	onClose: () => void;
}

export interface ContextMenuProps {
	contextMenu: ContextMenuState | null;
	onDuplicate: (nodeId: string) => void;
	onClose: () => void;
}
