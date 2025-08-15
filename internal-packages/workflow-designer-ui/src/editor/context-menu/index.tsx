import { Button } from "@giselle-internal/ui/button";
import { PopoverContent } from "@giselle-internal/ui/popover";
import { useToasts } from "@giselle-internal/ui/toast";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { useCallback } from "react";
import { useNodeManipulation } from "../node";
import type { ContextMenuProps } from "./types";

export function ContextMenu({
	id,
	top,
	left,
	right,
	bottom,
	onClose,
}: ContextMenuProps) {
	const { duplicate: duplicateNode } = useNodeManipulation();
	const { deleteNode } = useWorkflowDesigner();
	const toast = useToasts();

	const handleDuplicate = useCallback(() => {
		duplicateNode(id, () => toast.error("Failed to duplicate node"));
		onClose();
	}, [id, duplicateNode, toast, onClose]);

	const handleDelete = useCallback(() => {
		deleteNode(id);
		onClose();
	}, [id, deleteNode, onClose]);

	return (
		<div
			style={{ top, left, right, bottom }}
			className="fixed z-[1000]"
			role="menu"
			aria-label="Node actions"
		>
			<PopoverContent>
				<Button
					variant="subtle"
					size="default"
					onClick={handleDuplicate}
					className="w-full justify-start [&>div]:text-[12px]"
				>
					Duplicate
				</Button>
				<Button
					variant="subtle"
					size="default"
					onClick={handleDelete}
					className="w-full justify-start text-red-400 hover:text-red-300 [&>div]:text-[12px]"
				>
					Delete
				</Button>
			</PopoverContent>
		</div>
	);
}
