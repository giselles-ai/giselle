import {
	isOperationNode,
	isTriggerNode,
	type NodeLike,
	type OperationNode,
} from "@giselle-sdk/data-type";
import {
	defaultName,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import clsx from "clsx/lite";
import { CirclePlayIcon } from "lucide-react";
import { Dialog, DropdownMenu } from "radix-ui";
import {
	type ButtonHTMLAttributes,
	useCallback,
	useMemo,
	useState,
} from "react";
import { TriggerInputDialog } from "../../header/ui/trigger-input-dialog";
import { useFlowController } from "../../hooks/use-flow-controller";
import { NodeIcon } from "../../icons/node";
import { Button } from "./ui/button";

function NodeSelectItem({
	node,
	...props
}: { node: NodeLike } & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			className="group relative flex items-center py-[8px] px-[12px] gap-[10px] outline-none cursor-pointer hover:bg-black-400/30 rounded-[6px] w-full"
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
	const { startFlow } = useFlowController();

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
			if (node.inputs.length > 0) {
				return false;
			}
			return true;
		});
		return [...triggerNodes, ...startingOperationNodes];
	}, [data.nodes]);

	const startOperationFlow = useCallback(
		async (startingNode: OperationNode) => {
			const flow = buildWorkflowFromNode(startingNode, data);

			await startFlow(flow, [], {});
		},
		[startFlow, data],
	);

	if (startingNodes.length === 0) {
		return null;
	}

	return (
		<DropdownMenu.Root open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
			<DropdownMenu.Trigger asChild>
				<Button leftIcon={<CirclePlayIcon className="size-[15px]" />}>
					Run
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className={clsx(
						"relative rounded-[8px] px-[8px] py-[8px] min-w-[200px]",
						"bg-[rgba(0,0,0,_0.8)] text-white-900",
						"backdrop-blur-[4px]",
					)}
					sideOffset={5}
					align="end"
				>
					<div className="absolute z-0 rounded-[8px] inset-0 border mask-fill bg-gradient-to-br from-[hsla(232,37%,72%,0.2)] to-[hsla(218,58%,21%,0.9)] bg-origin-border bg-clip-border border-transparent" />
					{startingNodes.map((startingNode) => (
						<DropdownMenu.Item
							key={startingNode.id}
							asChild
							onSelect={async () => {
								if (isOperationNode(startingNode)) {
									await startOperationFlow(startingNode);
								}
							}}
						>
							{isTriggerNode(startingNode) ? (
								<Dialog.Root
									open={openDialogNodeId === startingNode.id}
									onOpenChange={(isOpen) => {
										setOpenDialogNodeId(isOpen ? startingNode.id : null);
									}}
								>
									<Dialog.Trigger asChild>
										<NodeSelectItem node={startingNode} />
									</Dialog.Trigger>
									<Dialog.Portal>
										<Dialog.Overlay className="fixed inset-0 bg-black/25 z-50" />
										<Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[400px] bg-black-900 rounded-[12px] p-[24px] shadow-xl z-50 overflow-hidden border border-black-400 outline-none">
											<Dialog.Title className="sr-only">
												Override inputs to test workflow
											</Dialog.Title>

											<TriggerInputDialog
												node={startingNode}
												onClose={() => {
													setIsDropdownOpen(false);
													setOpenDialogNodeId(null);
												}}
											/>
										</Dialog.Content>
									</Dialog.Portal>
								</Dialog.Root>
							) : (
								<NodeSelectItem node={startingNode} />
							)}
						</DropdownMenu.Item>
					))}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
