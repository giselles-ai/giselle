"use client";

/**
 * For editors (humans, Coding Agents like Cursor / Claude Code, etc.)
 *
 * Before modifying this component, please read:
 * - ./end-node-properties-panel-spec.md
 *
 * It documents the required behavior/invariants and includes a post-change checklist.
 */

import { Button } from "@giselle-internal/ui/button";
import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import { defaultName } from "@giselles-ai/node-registry";
import type {
	Connection,
	EndNode,
	NodeId,
	NodeLike,
} from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { PlusIcon, SquareArrowOutUpRightIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
	useAppDesignerStore,
	useConnectNodes,
	useDeleteNode,
	useDisconnectNodes,
	useUpdateNodeData,
} from "../../../app-designer";
import { NodeIcon } from "../../../icons/node";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { SettingLabel } from "../ui/setting-label";

function AddOutputButton({
	availableNodes,
	endNodeId,
	onConnectNodes,
}: {
	availableNodes: NodeLike[];
	endNodeId: NodeId;
	onConnectNodes: (outputNodeId: NodeId, inputNodeId: NodeId) => void;
}) {
	if (availableNodes.length === 0) {
		return (
			<Button
				type="button"
				leftIcon={<PlusIcon className="size-[12px]" />}
				disabled
			>
				Add output
			</Button>
		);
	}

	return (
		<DropdownMenu
			trigger={
				<Button type="button" leftIcon={<PlusIcon className="size-[12px]" />}>
					Add output
				</Button>
			}
			items={[
				{
					groupId: "available-nodes",
					groupLabel: "Nodes",
					items: availableNodes.map((availableNode) => ({
						value: availableNode.id,
						label: availableNode.name ?? defaultName(availableNode),
						node: availableNode,
					})),
				},
			]}
			renderItem={(item) => (
				<p className="text-[12px] truncate">{item.label}</p>
			)}
			onSelect={(_event, item) => {
				onConnectNodes(item.node.id, endNodeId);
			}}
			modal={false}
		/>
	);
}

export function EndNodePropertiesPanel({ node }: { node: EndNode }) {
	const deleteNode = useDeleteNode();
	const updateNodeData = useUpdateNodeData();
	const connectNodes = useConnectNodes();
	const disconnectNodes = useDisconnectNodes();
	const { nodes, connections } = useAppDesignerStore((s) => ({
		nodes: s.nodes,
		connections: s.connections,
	}));
	const isStartNodeConnectedToEndNode = useAppDesignerStore((s) =>
		s.isStartNodeConnectedToEndNode(),
	);
	const isTryAppInStageDisabled = !isStartNodeConnectedToEndNode;

	const connectedOutputsByOutputNode = useMemo(() => {
		const connectionsToThisNode = connections.filter(
			(connection) => connection.inputNode.id === node.id,
		);

		const groups = new Map<
			NodeId,
			{
				outputNodeId: NodeId;
				outputNode: NodeLike;
				items: {
					connection: Connection;
					outputLabel: string;
				}[];
			}
		>();

		for (const connection of connectionsToThisNode) {
			const outputNodeId = connection.outputNode.id;
			const outputNode = nodes.find((node) => node.id === outputNodeId);
			const outputLabel =
				outputNode?.outputs.find((output) => output.id === connection.outputId)
					?.label ?? connection.outputId;

			if (outputNode === undefined) {
				continue;
			}

			const existing = groups.get(outputNodeId);
			if (!existing) {
				groups.set(outputNodeId, {
					outputNodeId,
					outputNode,
					items: [{ connection, outputLabel }],
				});
				continue;
			}

			existing.items.push({ connection, outputLabel });
		}

		return [...groups.values()].sort((a, b) => {
			const aName = a.outputNode ? defaultName(a.outputNode) : a.outputNodeId;
			const bName = b.outputNode ? defaultName(b.outputNode) : b.outputNodeId;
			return aName.localeCompare(bName);
		});
	}, [connections, node.id, nodes]);

	const availableOutputSourceNodes = useMemo(() => {
		const connectedOutputNodeIdSet = new Set(
			connections
				.filter((connection) => connection.inputNode.id === node.id)
				.map((connection) => connection.outputNode.id),
		);

		return nodes
			.filter((maybeOutputNode) => maybeOutputNode.id !== node.id)
			.filter(
				(maybeOutputNode) => !connectedOutputNodeIdSet.has(maybeOutputNode.id),
			)
			.filter((maybeOutputNode) => maybeOutputNode.outputs.length > 0)
			.filter((maybeOutputNode) => maybeOutputNode.content.type !== "appEntry");
	}, [connections, node.id, nodes]);

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				onDelete={() => deleteNode(node.id)}
				readonly
			/>
			<PropertiesPanelContent>
				<div className="flex flex-col gap-[16px]">
					<div className="space-y-0">
						<div className="flex items-center justify-between gap-[12px]">
							<SettingLabel className="mb-0">Output(s) of the app</SettingLabel>
							{connectedOutputsByOutputNode.length > 0 && (
								<AddOutputButton
									availableNodes={availableOutputSourceNodes}
									endNodeId={node.id}
									onConnectNodes={connectNodes}
								/>
							)}
						</div>
						<p className="text-[11px] text-text-muted/50">
							What is displayed here will be shown as the result of the App.
						</p>
					</div>

					<div className="flex flex-col gap-[8px]">
						{connectedOutputsByOutputNode.length === 0 ? (
							<div className="rounded-[12px] border border-border-muted bg-background px-[12px] py-[10px]">
								<p className="text-[12px] text-text-muted">
									No outputs are connected to this End node yet.
								</p>
								<div className="mt-[10px] flex items-center justify-between gap-[12px]">
									<AddOutputButton
										availableNodes={availableOutputSourceNodes}
										endNodeId={node.id}
										onConnectNodes={connectNodes}
									/>
									{availableOutputSourceNodes.length === 0 && (
										<p className="text-[11px] text-text-muted/70">
											Add a node to use as an App output first.
										</p>
									)}
								</div>
							</div>
						) : (
							<ul className="flex flex-col gap-[8px]">
								{connectedOutputsByOutputNode.map((group) => {
									const hasMultipleOutputs = group.items.length >= 2;
									return (
										<li
											key={group.outputNodeId}
											className={clsx(
												"flex gap-[10px] rounded-[12px] border border-border-muted bg-background px-[12px] py-[10px] min-w-0 group",
												hasMultipleOutputs ? "items-start" : "items-center",
											)}
										>
											{group.outputNode ? (
												<div
													className={clsx(
														"flex size-[24px] shrink-0 items-center justify-center rounded-[6px] bg-black/10",
														hasMultipleOutputs && "mt-[2px]",
													)}
												>
													<NodeIcon
														node={group.outputNode}
														className="size-[14px] stroke-current fill-none text-text"
													/>
												</div>
											) : (
												<div
													className={clsx(
														"flex size-[24px] shrink-0 items-center justify-center rounded-[6px] bg-black/10 text-[10px] text-text-muted",
														hasMultipleOutputs && "mt-[2px]",
													)}
												>
													?
												</div>
											)}
											<div className="min-w-0 flex-1">
												<p className="text-[13px] font-medium text-text leading-[1.2] truncate">
													{group.outputNode
														? defaultName(group.outputNode)
														: group.outputNodeId}
												</p>
												{hasMultipleOutputs && (
													<ul className="mt-[6px] flex flex-col gap-[2px]">
														{group.items.map((item) => (
															<li
																key={item.connection.id}
																className="text-[11px] text-text-muted/80 leading-[1.2] truncate"
															>
																{item.outputLabel}
															</li>
														))}
													</ul>
												)}
											</div>
											<Button
												type="button"
												size="compact"
												className={clsx(
													"shrink-0 opacity-0 transition-opacity pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 focus:opacity-100 focus:pointer-events-auto",
													hasMultipleOutputs && "mt-[2px]",
												)}
												onClick={() => {
													disconnectNodes(group.outputNodeId, node.id);
												}}
												aria-label="Disconnect this node from the App output"
											>
												<TrashIcon className="size-[14px]" aria-hidden="true" />
											</Button>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					<TryPlaygroundSection isDisabled={isTryAppInStageDisabled} />
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}

function TryPlaygroundContent() {
	return (
		<span className="inline-flex items-center justify-center gap-[8px]">
			<span>Try App in Playground</span>
			<SquareArrowOutUpRightIcon className="size-[14px]" aria-hidden="true" />
		</span>
	);
}

function TryPlaygroundLink({ isDisabled }: { isDisabled: boolean }) {
	if (isDisabled) {
		return (
			<div
				aria-disabled="true"
				className="mt-[12px] w-full rounded-[12px] border border-blue-muted bg-blue-muted px-[16px] py-[12px] text-[14px] font-medium text-white transition-[filter] cursor-not-allowed opacity-50 text-center"
			>
				<TryPlaygroundContent />
			</div>
		);
	}

	return (
		<Link
			href="/playground"
			target="_blank"
			rel="noopener noreferrer"
			className="mt-[12px] w-full rounded-[12px] border border-blue-muted bg-blue-muted px-[16px] py-[12px] text-[14px] font-medium text-white transition-[filter] hover:brightness-110 text-center"
		>
			<TryPlaygroundContent />
		</Link>
	);
}

function TryPlaygroundSection({ isDisabled }: { isDisabled: boolean }) {
	return (
		<div className="w-full flex flex-col">
			<TryPlaygroundLink isDisabled={isDisabled} />
			{isDisabled && (
				<p className="mt-[8px] text-[12px] text-text-muted">
					Connect your flow so it reaches the End Node from the Start Node to
					enable “Try App in Playground”.
				</p>
			)}
		</div>
	);
}
