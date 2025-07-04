import { Button } from "@giselle-internal/ui/button";
import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import {
	type ConnectionId,
	type GitHubActionCommandConfiguredState,
	type Input,
	isTextGenerationNode,
	isTextNode,
	type Node,
	type NodeId,
	type OutputId,
} from "@giselle-sdk/data-type";
import { githubActionIdToLabel } from "@giselle-sdk/flow";
import {
	defaultName,
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import clsx from "clsx/lite";
import { TrashIcon, TriangleAlert } from "lucide-react";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { NodeIcon } from "../../../../icons/node";
import { GitHubRepositoryBlock } from "../../trigger-node-properties-panel/ui";
import { type InputWithConnectedOutput, useConnectedInputs } from "../lib";

export function GitHubActionConfiguredView({
	nodeId,
	inputs,
	state,
}: {
	nodeId: NodeId;
	inputs: Input[];
	state: GitHubActionCommandConfiguredState;
}) {
	const client = useGiselleEngine();
	const {
		deleteConnection,
		data: { ui },
	} = useWorkflowDesigner();
	const { isLoading, data } = useSWR(
		{
			installationId: state.installationId,
			repositoryNodeId: state.repositoryNodeId,
		},
		({ installationId, repositoryNodeId }) =>
			client.getGitHubRepositoryFullname({
				installationId,
				repositoryNodeId,
			}),
	);

	const { connectedInputs } = useConnectedInputs(nodeId, inputs);

	const handleClickRemoveButton = useCallback(
		(connectionId: ConnectionId) => () => {
			deleteConnection(connectionId);
		},
		[deleteConnection],
	);

	return (
		<div className="flex flex-col gap-[17px] p-0">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">Repository</p>
				<div className="px-[12px] pt-[6px]">
					{isLoading || data === undefined ? (
						<p>Loading...</p>
					) : (
						<GitHubRepositoryBlock
							owner={data.fullname.owner}
							repo={data.fullname.repo}
						/>
					)}
				</div>
			</div>

			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">Event Type</p>
				<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
					{githubActionIdToLabel(state.commandId)}
				</div>
			</div>

			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">Parameter</p>
				<div className="px-[16px] py-[9px] w-full bg-transparent text-[14px]">
					<ul className="w-full border-collapse divide-y divide-black-400">
						{connectedInputs.map((input) => (
							<li key={input.id} className="py-[12px]">
								<div className=" flex items-center justify-between">
									<div className="flex items-center gap-[4px]">
										<p className="text-[16px]">{input.label}</p>
										{input.isRequired ? (
											<span
												className={clsx(
													"px-2 py-0.5 rounded text-[12px]",
													input.connectedOutput === undefined
														? "bg-error-900/30 text-error-900 border border-error-900/30"
														: "text-green-900",
												)}
											>
												Required
											</span>
										) : (
											<span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
												Optional
											</span>
										)}
									</div>
									{input.connectedOutput ? (
										<div className="group flex items-center border border-black-400 px-[12px] py-[8px] rounded-[4px] gap-[6px] justify-between w-[300px]">
											<div className="flex items-center gap-[6px] whitespace-nowrap overflow-x-hidden flex-1 min-w-[0px]">
												<NodeIcon
													node={input.connectedOutput.node}
													className="size-[14px] shrink-0"
												/>
												<p className="truncate">
													{defaultName(input.connectedOutput.node)} /{" "}
													{input.connectedOutput.label}
												</p>
											</div>
											<button
												type="button"
												className="hidden group-hover:block px-[4px] h-[20px] bg-transparent hover:bg-white-900/20 rounded-[4px] transition-colors mr-[2px] flex-shrink-0 cursor-pointer"
												onClick={handleClickRemoveButton(
													input.connectedOutput.connectionId,
												)}
											>
												<TrashIcon className="size-[16px] stroke-current stroke-[1px] " />
											</button>
										</div>
									) : (
										<SelectOutputPopover nodeId={nodeId} input={input} />
									)}
								</div>
								{ui.nodeState[nodeId]?.showError &&
									input.isRequired &&
									input.connectedOutput === undefined && (
										<div className="flex justify-end">
											<div className="text-red-900 flex items-center gap-[4px]">
												<TriangleAlert className="size-[14px]" />
												<span>Please choose a source</span>
											</div>
										</div>
									)}
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}

type OutputWithDetails = {
	id: OutputId;
	label: string;
	node: Node;
};

function SelectOutputPopover({
	nodeId,
	input,
}: {
	nodeId: NodeId;
	input: InputWithConnectedOutput;
}) {
	const { data } = useWorkflowDesigner();

	const node = useMemo(
		() => data.nodes.find((n) => n.id === nodeId),
		[data.nodes, nodeId],
	);

	const groupedOutputs = useMemo(() => {
		const textNodes: OutputWithDetails[] = [];
		const generatedNodes: OutputWithDetails[] = [];

		for (const node of data.nodes) {
			if (node.id === nodeId) {
				continue;
			}
			for (const output of node.outputs) {
				if (isTextGenerationNode(node)) {
					generatedNodes.push({ ...output, node });
				} else if (isTextNode(node)) {
					textNodes.push({ ...output, node });
				}
			}
		}

		return [
			{ label: "Generated Content", nodes: generatedNodes },
			{ label: "Text", nodes: textNodes },
		].filter((group) => group.nodes.length > 0);
	}, [data.nodes, nodeId]);

	const { addConnection } = useWorkflowDesigner();

	const handleSelectOutput = useCallback(
		(outputNode: Node, outputId: OutputId) => {
			if (node === undefined) {
				return;
			}
			addConnection({
				outputNode,
				outputId,
				inputNode: node,
				inputId: input.id,
			});
		},
		[node, addConnection, input],
	);

	return (
		<DropdownMenu
			trigger={<Button>Select Source</Button>}
			items={groupedOutputs.map((groupedOutput) => ({
				groupId: groupedOutput.label,
				groupLabel: groupedOutput.label,
				items: groupedOutput.nodes,
			}))}
			renderItem={(item) => (
				<p className="text-[12px] truncate">
					{item.node.name ?? defaultName(item.node)} / {item.label}
				</p>
			)}
			onSelect={(_event, item) => handleSelectOutput(item.node, item.id)}
		/>
	);
}
