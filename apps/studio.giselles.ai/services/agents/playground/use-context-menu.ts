import { type MouseEventHandler, useCallback, useState } from "react";

interface ContextMenuPosition {
	x: number;
	y: number;
}

export const useContextMenu = () => {
	const [isVisible, setIsVisible] = useState(false);
	const [contextMenuPosition, setContextMenuPosition] =
		useState<ContextMenuPosition>({
			x: 0,
			y: 0,
		});

	const toggleContextMenu = useCallback(
		(x: number, y: number) => {
			if (isVisible) {
				setIsVisible(false);
				return;
			}
			setContextMenuPosition({ x, y });
			setIsVisible(true);
		},
		[isVisible],
	);

	const handleContextMenu: MouseEventHandler<HTMLDivElement> = useCallback(
		(event) => {
			event.preventDefault();
			toggleContextMenu(event.clientX, event.clientY);
		},
		[toggleContextMenu],
	);

	const hideContextMenu = useCallback(() => {
		setIsVisible(false);
	}, []);

	return {
		isVisible,
		contextMenuPosition,
		toggleContextMenu,
		hideContextMenu,
		handleContextMenu,
	};
};
