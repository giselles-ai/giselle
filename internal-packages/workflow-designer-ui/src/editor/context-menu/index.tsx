import { Button } from "@giselle-internal/ui/button";
import { PopoverContent } from "@giselle-internal/ui/popover";
import { useToasts } from "@giselle-internal/ui/toast";
import {
	convertContentGenerationToTextGeneration,
	convertTextGenerationToContentGeneration,
} from "@giselles-ai/node-registry";
import {
	isContentGenerationNode,
	isTextGenerationNode,
} from "@giselles-ai/protocol";
import { useWorkflowDesigner, useWorkflowDesignerStore } from "@giselles-ai/react";
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
	const updateNode = useWorkflowDesignerStore((state) => state.updateNode);
	const node = useWorkflowDesignerStore((state) =>
		state.workspace.nodes.find((n) => n.id === id),
	);
	const toast = useToasts();

	const handleDuplicate = useCallback(() => {
		duplicateNode(id, () => toast.error("Failed to duplicate node"));
		onClose();
	}, [id, duplicateNode, toast, onClose]);

	const handleDelete = useCallback(() => {
		deleteNode(id);
		onClose();
	}, [id, deleteNode, onClose]);

	const handleConvertToContentGeneration = useCallback(() => {
		if (!node || !isTextGenerationNode(node)) {
			toast.error("Failed to convert node");
			onClose();
			return;
		}
		const convertedNode = convertTextGenerationToContentGeneration(node);
		updateNode(id, convertedNode);
		toast.success("Converted to Content Generation node");
		onClose();
	}, [node, id, updateNode, toast, onClose]);

	const handleConvertToTextGeneration = useCallback(() => {
		if (!node || !isContentGenerationNode(node)) {
			toast.error("Failed to convert node");
			onClose();
			return;
		}
		const convertedNode = convertContentGenerationToTextGeneration(node);
		updateNode(id, convertedNode);
		toast.success("Converted to Text Generation node");
		onClose();
	}, [node, id, updateNode, toast, onClose]);

	const isTextGen = node && isTextGenerationNode(node);
	const isContentGen = node && isContentGenerationNode(node);

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
				{isTextGen && (
					<Button
						variant="subtle"
						size="default"
						onClick={handleConvertToContentGeneration}
						className="w-full justify-start [&>div]:text-[12px]"
					>
						Convert to Content Generation
					</Button>
				)}
				{isContentGen && (
					<Button
						variant="subtle"
						size="default"
						onClick={handleConvertToTextGeneration}
						className="w-full justify-start [&>div]:text-[12px]"
					>
						Convert to Text Generation
					</Button>
				)}
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
