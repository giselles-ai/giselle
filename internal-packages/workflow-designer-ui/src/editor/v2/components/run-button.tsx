import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import { useToasts } from "@giselle-internal/ui/toast";
import type { ConnectionId, NodeId, TriggerNode } from "@giselle-sdk/data-type";
import {
	isImageGenerationNode,
	isTextGenerationNode,
} from "@giselle-sdk/data-type";
import {
	defaultName,
	useActSystem,
	useNodeGroups,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { PlayIcon, UngroupIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { NodeIcon } from "../../../icons/node";
import { isPromptEmpty } from "../../lib/validate-prompt";
import { TriggerInputDialog } from "./trigger-input-dialog";

type RunItem = {
	nodeIds: NodeId[];
	connectionIds: ConnectionId[];
};

type TriggerRunItem = RunItem & {
	node: TriggerNode;
};

type NodeGroupRunItem = RunItem & {
	label: string;
};

type TriggerMenuItem = {
	value: string;
	label: string;
	type: "trigger";
	run: TriggerRunItem;
};

type NodeGroupMenuItem = {
	value: string;
	label: string;
	type: "nodeGroup";
	run: NodeGroupRunItem;
};

function CenteredDialogContent({ children }: React.PropsWithChildren) {
	return <DialogContent>{children}</DialogContent>;
}

function RunOptionItem({
	icon,
	title,
	subtitle,
	className,
	...props
}: {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
} & React.DetailedHTMLProps<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
>) {
	return (
		<button
			className={clsx(
				"flex items-center py-[8px] px-[12px] gap-[10px] w-full outline-none cursor-pointer hover:bg-ghost-element-hover rounded-[6px]",
				className,
			)}
			{...props}
		>
			<div className="p-[12px] bg-bg-800 rounded-[8px]">{icon}</div>
			<div className="flex flex-col gap-[0px] text-inverse items-start">
				<div className="text-[13px]">{title}</div>
				<div className="text-[12px] text-inverse">{subtitle}</div>
			</div>
		</button>
	);
}

function useRunAct() {
	const { data, setUiNodeState } = useWorkflowDesigner();
	const { createAndStartAct } = useActSystem(data.id);
	const { toast, error } = useToasts();

	return async (item: RunItem) => {
		for (const nodeId of item.nodeIds) {
			const node = data.nodes.find((n) => n.id === nodeId);
			if (node && (isTextGenerationNode(node) || isImageGenerationNode(node))) {
				if (isPromptEmpty(node.content.prompt)) {
					error("Please fill in the prompt to run.");
					return;
				}
			}
		}

		for (const nodeId of item.nodeIds) {
			setUiNodeState(nodeId, { highlighted: false });
		}

		const isSingleNodeRun =
			item.connectionIds.length === 0 && item.nodeIds.length === 1;
		const nodeId = isSingleNodeRun ? item.nodeIds[0] : undefined;
		await createAndStartAct({
			connectionIds: item.connectionIds,
			nodeId,
			inputs: [],
			onActStart({ cancel, actId }) {
				toast("Workflow submitted successfully", {
					id: actId,
					preserve: true,
					action: {
						label: "Cancel",
						onClick: async () => {
							await cancel();
						},
					},
				});
			},
			onActComplete: ({ actId }) => {
				toast.dismiss(actId);
			},
		});
	};
}

function SingleTriggerRunButton({
	triggerRun,
}: {
	triggerRun: TriggerRunItem;
}) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button
					leftIcon={<PlayIcon className="size-[15px] fill-current" />}
					variant="glass"
					size="large"
				>
					Run
				</Button>
			</DialogTrigger>
			<CenteredDialogContent>
				<DialogTitle className="sr-only">
					Override inputs to test workflow
				</DialogTitle>
				<TriggerInputDialog
					node={triggerRun.node}
					connectionIds={triggerRun.connectionIds}
					onClose={() => setIsDialogOpen(false)}
				/>
			</CenteredDialogContent>
		</Dialog>
	);
}

function SingleNodeGroupRunButton({
	nodeGroupRun,
}: {
	nodeGroupRun: NodeGroupRunItem;
}) {
	const runAct = useRunAct();

	return (
		<Button
			leftIcon={<PlayIcon className="size-[15px] fill-current" />}
			variant="glass"
			size="large"
			onClick={() => runAct(nodeGroupRun)}
		>
			Run
		</Button>
	);
}

function MultipleRunsDropdown({
	triggerRuns,
	nodeGroupRuns,
}: {
	triggerRuns: TriggerRunItem[];
	nodeGroupRuns: NodeGroupRunItem[];
}) {
	const { data, setUiNodeState } = useWorkflowDesigner();
	const runAct = useRunAct();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [openDialogNodeId, setOpenDialogNodeId] = useState<string | null>(null);

	const runGroups = useMemo(() => {
		const groups = [];
		if (triggerRuns.length > 0) {
			groups.push({
				groupId: "triggerNodes",
				groupLabel: "Trigger Nodes",
				items: triggerRuns.map((run) => ({
					value: run.node.id,
					label: run.node.name ?? defaultName(run.node),
					type: "trigger" as const,
					run,
				})),
			});
		}
		if (nodeGroupRuns.length > 0) {
			groups.push({
				groupId: "nodeGroups",
				groupLabel: "Node Groups",
				items: nodeGroupRuns.map((run, index) => ({
					value: `nodeGroup-${index}`,
					label: run.label,
					type: "nodeGroup" as const,
					run,
				})),
			});
		}
		return groups;
	}, [triggerRuns, nodeGroupRuns]);

	const highlightNodes = useCallback(
		(runItem: RunItem, isHovered: boolean) => {
			for (const node of data.nodes) {
				if (runItem.nodeIds.includes(node.id)) {
					setUiNodeState(node.id, { highlighted: isHovered });
				}
			}
		},
		[data.nodes, setUiNodeState],
	);

	return (
		<DropdownMenu
			open={isDropdownOpen}
			onOpenChange={setIsDropdownOpen}
			onSelect={async (_event, item) => {
				const menuItem = item as TriggerMenuItem | NodeGroupMenuItem;
				if (menuItem.type === "nodeGroup") {
					await runAct(menuItem.run);
				}
			}}
			onItemHover={(item, isHovered) => {
				const menuItem = item as TriggerMenuItem | NodeGroupMenuItem;
				highlightNodes(menuItem.run, isHovered);
			}}
			items={runGroups}
			renderItemAsChild
			renderItem={(item, props) => {
				const menuItem = item as TriggerMenuItem | NodeGroupMenuItem;
				if (menuItem.type === "nodeGroup") {
					return (
						<RunOptionItem
							icon={<UngroupIcon className="size-[16px]" />}
							title={menuItem.run.label}
							subtitle={menuItem.value}
							{...props}
						/>
					);
				}

				const triggerNode = menuItem.run.node;
				return (
					<Dialog
						open={openDialogNodeId === triggerNode.id}
						onOpenChange={(isOpen) => {
							setOpenDialogNodeId(isOpen ? triggerNode.id : null);
							if (!isOpen) {
								setIsDropdownOpen(false);
							}
						}}
					>
						<DialogTrigger asChild>
							<RunOptionItem
								icon={
									<NodeIcon
										node={triggerNode}
										className="size-[16px] text-inverse"
									/>
								}
								title={triggerNode.name ?? defaultName(triggerNode)}
								subtitle={triggerNode.id}
								{...props}
							/>
						</DialogTrigger>
						<CenteredDialogContent>
							<DialogTitle className="sr-only">
								Override inputs to test workflow
							</DialogTitle>
							<TriggerInputDialog
								node={triggerNode}
								connectionIds={menuItem.run.connectionIds}
								onClose={() => {
									setIsDropdownOpen(false);
									setOpenDialogNodeId(null);
								}}
							/>
						</CenteredDialogContent>
					</Dialog>
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

export function RunButton() {
	const nodeGroups = useNodeGroups();

	const { triggerRuns, nodeGroupRuns } = useMemo(() => {
		const triggerRuns: TriggerRunItem[] = nodeGroups.triggerNodeGroups.map(
			(group) => ({
				node: group.node,
				nodeIds: group.nodeGroup.nodeIds,
				connectionIds: group.nodeGroup.connectionIds,
			}),
		);

		const nodeGroupRuns: NodeGroupRunItem[] =
			nodeGroups.operationNodeGroups.map((group, index) => ({
				label: `Group ${index + 1}`,
				nodeIds: group.nodeIds,
				connectionIds: group.connectionIds,
			}));

		return { triggerRuns, nodeGroupRuns };
	}, [nodeGroups]);

	const totalRuns = triggerRuns.length + nodeGroupRuns.length;

	// No runnable items
	if (totalRuns === 0) {
		return null;
	}

	// Single trigger node
	if (totalRuns === 1 && triggerRuns.length === 1) {
		return <SingleTriggerRunButton triggerRun={triggerRuns[0]} />;
	}

	// Single node group
	if (totalRuns === 1 && nodeGroupRuns.length === 1) {
		return <SingleNodeGroupRunButton nodeGroupRun={nodeGroupRuns[0]} />;
	}

	// Multiple options
	return (
		<MultipleRunsDropdown
			triggerRuns={triggerRuns}
			nodeGroupRuns={nodeGroupRuns}
		/>
	);
}
