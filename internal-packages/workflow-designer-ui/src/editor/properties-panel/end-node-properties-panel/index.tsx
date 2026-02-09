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
import { isAppEntryNode } from "@giselles-ai/protocol";
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
				Add Output
			</Button>
		);
	}

	return (
		<DropdownMenu
			trigger={
				<Button type="button" leftIcon={<PlusIcon className="size-[12px]" />}>
					Add Output
				</Button>
			}
			items={availableNodes.map((availableNode) => ({
				value: availableNode.id,
				label: availableNode.name ?? defaultName(availableNode),
			}))}
			renderItem={(item) => (
				<p className="text-[12px] truncate">{item.label}</p>
			)}
			onSelect={(_event, item) => {
				onConnectNodes(item.value as NodeId, endNodeId);
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
	const appId = useMemo(() => {
		const appEntryNode = nodes.find((n) => isAppEntryNode(n));
		if (!appEntryNode) return undefined;
		if (appEntryNode.content.status !== "configured") return undefined;
		return appEntryNode.content.appId;
	}, [nodes]);

	const helperTextClassName = "text-[11px] text-text-muted/50";
	const emptyStateHelperTextClassName = "text-[11px] text-text-muted/70";
	const listClassName = "flex flex-col gap-[8px]";
	const connectedRowBaseClassName =
		"flex gap-[10px] rounded-[12px] border border-border-muted bg-transparent px-[12px] py-[10px] min-w-0 group";

	const connectedOutputsByOutputNode = useMemo(() => {
		const nodeById = new Map(nodes.map((node) => [node.id, node] as const));
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
			const outputNode = nodeById.get(outputNodeId);
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

		// Preserve insertion order (i.e. the order connections were created / stored),
		// so newly connected output nodes appear below earlier ones.
		return [...groups.values()];
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
				docsUrl="https://docs.giselles.ai/en/glossary/start-end-nodes#end-node"
				onDelete={() => deleteNode(node.id)}
				readonly
			/>
			<PropertiesPanelContent>
				<div className="flex flex-col gap-[16px]">
					<div className="space-y-0">
						<div className="flex items-center justify-between gap-[12px]">
							<SettingLabel className="mb-0">Outputs</SettingLabel>
							<AddOutputButton
								availableNodes={availableOutputSourceNodes}
								endNodeId={node.id}
								onConnectNodes={connectNodes}
							/>
						</div>
						<p className={helperTextClassName}>
							These outputs will determine the results of your app.
						</p>
					</div>

					<div className={listClassName}>
						{connectedOutputsByOutputNode.length === 0 ? (
							<div className="rounded-[12px] bg-error-900/10 px-[12px] py-[10px]">
								<p className="text-[12px] text-error-900">
									This node doesn't have any outputs yet.
								</p>
								{availableOutputSourceNodes.length === 0 && (
									<p
										className={clsx("mt-[6px]", emptyStateHelperTextClassName)}
									>
										Add a node as an output first.
									</p>
								)}
							</div>
						) : (
							<ul className={listClassName}>
								{connectedOutputsByOutputNode.map((group) => {
									const hasMultipleOutputs = group.items.length >= 2;
									return (
										<li
											key={group.outputNodeId}
											className={clsx(
												connectedRowBaseClassName,
												hasMultipleOutputs ? "items-start" : "items-center",
											)}
										>
											{group.outputNode ? (
												<div
													className={clsx(
														"flex size-[24px] shrink-0 items-center justify-center",
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
														"flex size-[24px] shrink-0 items-center justify-center text-[10px] text-text-muted",
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

					<TryPlaygroundSection
						isDisabled={isTryAppInStageDisabled}
						appId={appId}
					/>
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

function TryPlaygroundLink({
	isDisabled,
	appId,
}: {
	isDisabled: boolean;
	appId?: string;
}) {
	if (isDisabled) {
		return (
			<div
				aria-disabled="true"
				className="w-full rounded-[12px] border border-blue-muted bg-blue-muted px-[16px] py-[12px] text-[14px] font-medium text-white transition-[filter] text-center cursor-not-allowed opacity-50"
			>
				<TryPlaygroundContent />
			</div>
		);
	}

	const href =
		appId === undefined
			? "/playground"
			: `/playground?initialAppId=${encodeURIComponent(appId)}`;

	return (
		<Link
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="block w-full rounded-[12px] border border-blue-muted bg-blue-muted px-[16px] py-[12px] text-[14px] font-medium text-white transition-[filter] text-center hover:brightness-110"
		>
			<TryPlaygroundContent />
		</Link>
	);
}

function TryPlaygroundSection({
	isDisabled,
	appId,
}: {
	isDisabled: boolean;
	appId?: string;
}) {
	return (
		<div className="mt-[12px]">
			<TryPlaygroundLink isDisabled={isDisabled} appId={appId} />
			{isDisabled && (
				<p className="mt-[6px] text-[11px] text-text-muted/50">
					Make sure there's a connection from Start to End to try this app in
					the playground.
				</p>
			)}
		</div>
	);
}
