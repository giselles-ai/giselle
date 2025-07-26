import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import {
	isOperationNode,
	isTriggerNode,
	type NodeLike,
} from "@giselle-sdk/data-type";
import { defaultName, useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { PlayIcon } from "lucide-react";
import { type ButtonHTMLAttributes, useMemo, useState } from "react";
import { useActController } from "../../../hooks/use-act-controller";
import { NodeIcon } from "../../../icons/node";
import { TriggerInputDialog } from "./trigger-input-dialog";

function NodeSelectItem({
	node,
	...props
}: { node: NodeLike } & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			className="flex items-center py-[8px] px-[12px] gap-[10px] outline-none w-full cursor-pointer"
			{...props}
		>
			<div className="p-[12px] bg-black-800 rounded-[8px]">
				<NodeIcon node={node} className="size-[16px] text-white-900" />
			</div>
			<div className="flex flex-col gap-[0px] text-white-900 items-start">
				<div className="text-[13px]">{node.name ?? defaultName(node)}</div>
				<div className="text-[12px] text-white-400">{node.id}</div>
			</div>
		</button>
	);
}

export function RunButton() {
	const { data } = useWorkflowDesigner();
	const { createAndStartAct } = useActController();

	const [openDialogNodeId, setOpenDialogNodeId] = useState<string | null>(null);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const startingNodes = useMemo(() => {
		const triggerNodes = data.nodes.filter((node) => isTriggerNode(node));
		const startingOperationNodes = data.nodes.filter((node) => {
			if (!isOperationNode(node)) {
				return false;
			}
			if (isTriggerNode(node)) {
				return false;
			}
			if (
				data.connections.some(
					(connection) =>
						connection.outputNode.type === "operation" &&
						connection.inputNode.id === node.id,
				)
			) {
				return false;
			}
			return true;
		});
		return [...triggerNodes, ...startingOperationNodes];
	}, [data.nodes, data.connections]);

	if (startingNodes.length === 0) {
		return null;
	}

	return (
		<DropdownMenu
			open={isDropdownOpen}
			onOpenChange={setIsDropdownOpen}
			onSelect={async (_event, item) => {
				const startingNode = item.node;
				if (!isTriggerNode(startingNode) && isOperationNode(startingNode)) {
					await createAndStartAct({ startNodeId: startingNode.id, inputs: [] });
				}
			}}
			items={startingNodes.map((node) => ({
				value: node.id,
				label: node.name ?? defaultName(node),
				node,
			}))}
			renderItemAsChild
			renderItem={(item) => {
				const startingNode = item.node;
				return isTriggerNode(startingNode) ? (
					<Dialog
						open={openDialogNodeId === startingNode.id}
						onOpenChange={(isOpen) => {
							setOpenDialogNodeId(isOpen ? startingNode.id : null);
							if (!isOpen) {
								setIsDropdownOpen(false);
							}
						}}
					>
						<DialogTrigger asChild>
							<NodeSelectItem node={startingNode} />
						</DialogTrigger>
						<DialogContent>
							<DialogTitle className="sr-only">
								Override inputs to test workflow
							</DialogTitle>

							<TriggerInputDialog
								node={startingNode}
								onClose={() => {
									setIsDropdownOpen(false);
									setOpenDialogNodeId(null);
								}}
							/>
						</DialogContent>
					</Dialog>
				) : (
					<NodeSelectItem node={startingNode} />
				);
			}}
			trigger={
				<Button
					leftIcon={<PlayIcon className="size-[15px] fill-current" />}
					variant="glass"
					size="large"
				>
					Run
				</Button>
			}
			sideOffset={4}
			align="end"
		/>
	);
}
