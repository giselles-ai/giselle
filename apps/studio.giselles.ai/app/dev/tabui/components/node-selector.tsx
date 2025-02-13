import { type DragEvent, type FC, type ReactNode, useCallback } from "react";
import { useDnD } from "../contexts/drag-and-drop";

type NodeSelectorProps = {
	icon: ReactNode;
	nodeClassName: string;
	className?: string;
	label: ReactNode;
};

export const NodeSelector: FC<NodeSelectorProps> = ({
	icon,
	className,
	nodeClassName,
	label,
}) => {
	const { setDragPayload } = useDnD();

	const handleDragStart = useCallback(
		(nodeClassName: string) => (event: DragEvent<HTMLDivElement>) => {
			if (event == null) {
				return;
			}
			event.dataTransfer.effectAllowed = "move";
			setDragPayload(nodeClassName);
		},
		[setDragPayload],
	);

	return (
		<div className={`grid gap-1 ${className}`}>
			<div className="flex justify-center">
				<div
					draggable
					onDragStart={handleDragStart(nodeClassName)}
					className="opacity-[.9999]"
				>
					<div className="p-1.5 rounded-xl cursor-grab border border-transparent hover:border-rosepine-text overflow-hidden iconBase">
						<div className="p-1 rounded-xl iconWrap">
							<div className="iconMain">{icon}</div>
						</div>
					</div>
				</div>
			</div>
			<div className="text-[10px] text-center leading-tight">{label}</div>
		</div>
	);
};
