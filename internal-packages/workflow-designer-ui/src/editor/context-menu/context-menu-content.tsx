import type { ContextMenuContentProps } from "./types";

export function ContextMenuContent({
	x,
	y,
	onDuplicate,
}: ContextMenuContentProps) {
	return (
		<div
			className="fixed bg-[#1a1a1a] border border-[#333] rounded-md p-1 z-[1000]"
			style={{ left: x, top: y }}
		>
			<button
				type="button"
				className="w-full px-3 py-2 text-white bg-transparent border-none cursor-pointer text-left whitespace-nowrap hover:bg-[#333]"
				onClick={(e) => {
					e.stopPropagation();
					onDuplicate();
				}}
			>
				Duplicate Node
			</button>
		</div>
	);
}
