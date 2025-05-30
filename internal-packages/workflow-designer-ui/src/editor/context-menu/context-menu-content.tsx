import { useEffect, useRef, useState } from "react";
import type { ContextMenuContentProps } from "./types";

export function ContextMenuContent({
	x,
	y,
	onDuplicate,
	onClose,
}: ContextMenuContentProps) {
	const menuRef = useRef<HTMLUListElement>(null);
	const firstButtonRef = useRef<HTMLButtonElement>(null); // Ref to the button inside li
	const [adjustedPosition, setAdjustedPosition] = useState({ left: x, top: y });

	// Effect for bounds checking
	useEffect(() => {
		if (menuRef.current) {
			const menuRect = menuRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;
			let newX = x;
			let newY = y;
			if (x + menuRect.width > viewportWidth)
				newX = viewportWidth - menuRect.width - 5;
			if (y + menuRect.height > viewportHeight)
				newY = viewportHeight - menuRect.height - 5;
			if (newX < 5) newX = 5;
			if (newY < 5) newY = 5;
			setAdjustedPosition({ left: newX, top: newY });
		}
	}, [x, y]);

	// Effect for Escape key handling and initial focus
	useEffect(() => {
		firstButtonRef.current?.focus(); // Focus the button

		const handleGlobalKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.stopPropagation();
				onClose();
			}
			// Arrow key navigation for menu items
			if (
				menuRef.current &&
				(event.key === "ArrowDown" || event.key === "ArrowUp")
			) {
				event.preventDefault();
				const items = Array.from(
					menuRef.current.querySelectorAll<HTMLButtonElement>(
						'[role="menuitem"]',
					),
				);
				const currentIndex = items.findIndex(
					(item) => item === document.activeElement,
				);
				let nextIndex = -1;

				if (event.key === "ArrowDown") {
					nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
				} else if (event.key === "ArrowUp") {
					nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
				}
				items[nextIndex]?.focus();
			}
		};

		document.addEventListener("keydown", handleGlobalKeyDown);
		return () => {
			document.removeEventListener("keydown", handleGlobalKeyDown);
		};
	}, [onClose]);

	const handleDuplicateAction = () => {
		onDuplicate();
		onClose();
	};

	return (
		<ul
			ref={menuRef}
			className="fixed bg-[#1a1a1a] border border-[#333] rounded-md p-1 z-[1000] shadow-lg list-none m-0"
			role="menu"
			aria-label="Node actions"
			style={{ left: adjustedPosition.left, top: adjustedPosition.top }}
		>
			<li role="presentation">
				{/* li is now a presentational container for the menuitem button */}
				<button
					ref={firstButtonRef}
					type="button"
					role="menuitem"
					className="w-full px-3 py-2 text-white bg-transparent border-none cursor-pointer text-left whitespace-nowrap hover:bg-[#333] focus:outline-none focus:bg-[#444] rounded-sm"
					onClick={(e) => {
						e.stopPropagation();
						handleDuplicateAction();
					}}
					// onKeyDown for Enter/Space is often handled by button itself, but explicit handling is fine
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault(); // Prevent space from scrolling
							e.stopPropagation();
							handleDuplicateAction();
						}
					}}
				>
					Duplicate Node
				</button>
			</li>
		</ul>
	);
}
