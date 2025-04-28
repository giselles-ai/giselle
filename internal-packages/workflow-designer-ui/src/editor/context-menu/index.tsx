import { useState } from "react";
import { ContextMenuContent } from "./context-menu-content";
import type { ContextMenuProps, ContextMenuState } from "./types";

export function useContextMenu() {
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

	return {
		contextMenu,
		setContextMenu,
		closeContextMenu: () => setContextMenu(null),
	};
}

export function ContextMenu({ contextMenu, onDuplicate }: ContextMenuProps) {
	if (!contextMenu) return null;

	return (
		<ContextMenuContent
			x={contextMenu.x}
			y={contextMenu.y}
			onDuplicate={() => onDuplicate(contextMenu.nodeId)}
		/>
	);
}

export type { ContextMenuState } from "./types";
