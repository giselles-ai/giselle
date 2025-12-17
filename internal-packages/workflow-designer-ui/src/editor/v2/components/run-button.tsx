import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import {
	DropdownMenu,
	type MenuGroup,
	type MenuItem,
} from "@giselle-internal/ui/dropdown-menu";
import { useToasts } from "@giselle-internal/ui/toast";
import type { CreateAndStartTaskInputs } from "@giselles-ai/giselle";
import { defaultName } from "@giselles-ai/node-registry";
import type {
	AppEntryNode,
	ConnectionId,
	NodeId,
	TriggerNode,
} from "@giselles-ai/protocol";
import {
	isAppEntryNode,
	isImageGenerationNode,
	isTextGenerationNode,
	isTriggerNode,
} from "@giselles-ai/protocol";
import { useNodeGroups, useTaskSystem } from "@giselles-ai/react";
import clsx from "clsx/lite";
import { PlayIcon, UngroupIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AppEntryInputDialog } from "../../../app/app-entry-input-dialog";
import {
	useAppDesignerStore,
	useWorkspaceActions,
} from "../../../app-designer/store/hooks";
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
type AppEntryRunItem = RunItem & {
	node: AppEntryNode;
};
type StarterRunItem = TriggerRunItem | AppEntryRunItem;

type NodeGroupRunItem = RunItem & {
	label: string;
};

type StarterMenuItem = {
	value: string;
	label: string;
	type: "trigger" | "appEntry";
	run: StarterRunItem;
};

type NodeGroupMenuItem = {
	value: string;
	label: string;
	type: "nodeGroup";
	run: NodeGroupRunItem;
};

type SubmitCreateAndStartTaskInput = Pick<
	CreateAndStartTaskInputs,
	"connectionIds" | "inputs" | "nodeId"
>;
type SubmitCreateAndStartTask = (
	input: SubmitCreateAndStartTaskInput,
) => Promise<void>;

function CenteredDialogContent({ children }: React.PropsWithChildren) {
	return <DialogContent variant="glass">{children}</DialogContent>;
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
	const { nodes, workspaceId } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		workspaceId: s.workspaceId,
	}));
	const setUiNodeState = useWorkspaceActions((a) => a.setUiNodeState);
	const { createAndStartTask } = useTaskSystem(workspaceId);
	const { toast, error } = useToasts();

	return async (item: RunItem) => {
		for (const nodeId of item.nodeIds) {
			const node = nodes.find((n) => n.id === nodeId);
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
		await createAndStartTask({
			connectionIds: item.connectionIds,
			nodeId,
			inputs: [],
			onTaskStart({ cancel, taskId }) {
				toast("Workflow submitted successfully", {
					id: taskId,
					preserve: true,
					action: {
						label: "Cancel",
						onClick: async () => {
							await cancel();
						},
					},
				});
			},
			onTaskComplete: ({ taskId }) => {
				toast.dismiss(taskId);
			},
		});
	};
}

function SingleStarterRunButton({
	starterRun,
	onCreateAndStartTaskSubmit,
}: {
	starterRun: StarterRunItem;
	onCreateAndStartTaskSubmit: SubmitCreateAndStartTask;
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
				{isTriggerNode(starterRun.node) && (
					<TriggerInputDialog
						node={starterRun.node}
						connectionIds={starterRun.connectionIds}
						onClose={() => setIsDialogOpen(false)}
					/>
				)}
				{isAppEntryNode(starterRun.node) && (
					<AppEntryInputDialog
						node={starterRun.node}
						onClose={() => setIsDialogOpen(false)}
						onSubmit={(event) =>
							onCreateAndStartTaskSubmit({
								nodeId: starterRun.node.id,
								inputs: event.inputs,
							})
						}
					/>
				)}
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

type RunMenuItem = MenuItem<
	| {
			type: "appEntry" | "trigger";
			run: StarterRunItem;
	  }
	| {
			type: "nodeGroup";
			run: NodeGroupRunItem;
	  }
>;
function MultipleRunsDropdown({
	starterRuns,
	nodeGroupRuns,
	onCreateAndStartTaskSubmit,
}: {
	starterRuns: StarterRunItem[];
	nodeGroupRuns: NodeGroupRunItem[];
	onCreateAndStartTaskSubmit: SubmitCreateAndStartTask;
}) {
	const nodes = useAppDesignerStore((s) => s.nodes);
	const setUiNodeState = useWorkspaceActions((a) => a.setUiNodeState);
	const runAct = useRunAct();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [openDialogNodeId, setOpenDialogNodeId] = useState<string | null>(null);

	const runGroups = useMemo(() => {
		const groups: MenuGroup<RunMenuItem>[] = [];
		if (starterRuns.length > 0) {
			const appEntryRunItems: RunMenuItem[] = [];
			const triggerRunItems: RunMenuItem[] = [];
			for (const starterRun of starterRuns) {
				switch (starterRun.node.content.type) {
					case "appEntry":
						appEntryRunItems.push({
							value: starterRun.node.id,
							label: starterRun.node.name ?? defaultName(starterRun.node),
							type: "appEntry" as const,
							run: starterRun,
						});
						break;
					case "trigger":
						triggerRunItems.push({
							value: starterRun.node.id,
							label: starterRun.node.name ?? defaultName(starterRun.node),
							type: "trigger" as const,
							run: starterRun,
						});
						break;
					default: {
						const _exhaustiveCheck: never = starterRun.node.content;
						throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
					}
				}
			}
			if (appEntryRunItems.length > 0) {
				groups.push({
					groupId: "appEntry",
					groupLabel: "App Entry Nodes",
					items: appEntryRunItems,
				});
			}
			if (triggerRunItems.length > 0) {
				groups.push({
					groupId: "trigger",
					groupLabel: "Trigger Nodes",
					items: triggerRunItems,
				});
			}
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
	}, [starterRuns, nodeGroupRuns]);

	const highlightNodes = useCallback(
		(runItem: RunItem, isHovered: boolean) => {
			for (const node of nodes) {
				if (runItem.nodeIds.includes(node.id)) {
					setUiNodeState(node.id, { highlighted: isHovered });
				}
			}
		},
		[nodes, setUiNodeState],
	);

	return (
		<DropdownMenu
			open={isDropdownOpen}
			onOpenChange={setIsDropdownOpen}
			onSelect={async (_event, item) => {
				const menuItem = item as StarterMenuItem | NodeGroupMenuItem;
				if (menuItem.type === "nodeGroup") {
					await runAct(menuItem.run);
				}
			}}
			onItemHover={(item, isHovered) => {
				const menuItem = item as StarterMenuItem | NodeGroupMenuItem;
				highlightNodes(menuItem.run, isHovered);
			}}
			items={runGroups}
			renderItemAsChild
			renderItem={(item, props) => {
				const menuItem = item as StarterMenuItem | NodeGroupMenuItem;
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

				const starterNode = menuItem.run.node;
				return (
					<Dialog
						open={openDialogNodeId === starterNode.id}
						onOpenChange={(isOpen) => {
							setOpenDialogNodeId(isOpen ? starterNode.id : null);
							if (!isOpen) {
								setIsDropdownOpen(false);
							}
						}}
					>
						<DialogTrigger asChild>
							<RunOptionItem
								icon={
									<NodeIcon
										node={starterNode}
										className="size-[16px] text-inverse"
									/>
								}
								title={starterNode.name ?? defaultName(starterNode)}
								subtitle={starterNode.id}
								{...props}
							/>
						</DialogTrigger>
						<CenteredDialogContent>
							<DialogTitle className="sr-only">
								Override inputs to test workflow
							</DialogTitle>
							{isTriggerNode(starterNode) && (
								<TriggerInputDialog
									node={starterNode}
									connectionIds={menuItem.run.connectionIds}
									onClose={() => {
										setIsDropdownOpen(false);
										setOpenDialogNodeId(null);
									}}
								/>
							)}
							{isAppEntryNode(starterNode) && (
								<AppEntryInputDialog
									node={starterNode}
									onClose={() => {
										setIsDropdownOpen(false);
										setOpenDialogNodeId(null);
									}}
									onSubmit={(event) =>
										onCreateAndStartTaskSubmit({
											nodeId: starterNode.id,
											inputs: event.inputs,
										})
									}
								/>
							)}
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
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const { createAndStartTask } = useTaskSystem(workspaceId);

	const { starterRuns, nodeGroupRuns } = useMemo(() => {
		const starterRuns: StarterRunItem[] = [];

		if (
			!nodeGroups?.starterNodeGroups ||
			!Array.isArray(nodeGroups.starterNodeGroups) ||
			!nodeGroups?.operationNodeGroups ||
			!Array.isArray(nodeGroups.operationNodeGroups)
		) {
			return { starterRuns: [], nodeGroupRuns: [] };
		}

		for (const group of nodeGroups.starterNodeGroups) {
			switch (group.node.content.type) {
				case "appEntry":
					starterRuns.push({
						node: group.node as AppEntryNode,
						nodeIds: group.nodeGroup.nodeIds,
						connectionIds: group.nodeGroup.connectionIds,
					});
					break;
				case "trigger":
					starterRuns.push({
						node: group.node as TriggerNode,
						nodeIds: group.nodeGroup.nodeIds,
						connectionIds: group.nodeGroup.connectionIds,
					});
					break;
				default: {
					const _exhaustiveCheck: never = group.node.content;
					throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
				}
			}
		}

		const nodeGroupRuns: NodeGroupRunItem[] =
			nodeGroups.operationNodeGroups.map((group, index) => ({
				label: `Group ${index + 1}`,
				nodeIds: group.nodeIds,
				connectionIds: group.connectionIds,
			}));

		return { starterRuns, nodeGroupRuns };
	}, [nodeGroups]);

	const totalRuns = starterRuns.length + nodeGroupRuns.length;
	const { toast } = useToasts();

	const handleCreateAndStartTaskSubmit = useCallback(
		async (input: SubmitCreateAndStartTaskInput) => {
			await createAndStartTask({
				...input,
				onTaskStart({ cancel, taskId }) {
					toast("Workflow submitted successfully", {
						id: taskId,
						preserve: true,
						action: {
							label: "Cancel",
							onClick: async () => {
								await cancel();
							},
						},
					});
				},
				onTaskComplete: ({ taskId }) => {
					toast.dismiss(taskId);
				},
			});
		},
		[createAndStartTask, toast],
	);

	// No runnable items
	if (totalRuns === 0) {
		return null;
	}

	// Single trigger node
	if (totalRuns === 1 && starterRuns.length === 1) {
		return (
			<SingleStarterRunButton
				starterRun={starterRuns[0]}
				onCreateAndStartTaskSubmit={handleCreateAndStartTaskSubmit}
			/>
		);
	}

	// Single node group
	if (totalRuns === 1 && nodeGroupRuns.length === 1) {
		return <SingleNodeGroupRunButton nodeGroupRun={nodeGroupRuns[0]} />;
	}

	// Multiple options
	return (
		<MultipleRunsDropdown
			starterRuns={starterRuns}
			nodeGroupRuns={nodeGroupRuns}
			onCreateAndStartTaskSubmit={handleCreateAndStartTaskSubmit}
		/>
	);
}
