import {
	FileNode,
	GitHubNode,
	type Node,
	type OutputId,
	TextGenerationNode,
	TextNode,
} from "@giselle-sdk/data-type";
import {
	Handle,
	type NodeProps,
	type NodeTypes,
	Position,
	type Node as XYFlowNode,
} from "@xyflow/react";
import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useMemo } from "react";
import { NodeIcon } from "../../icons/node";
import { defaultName } from "../../utils";

type GiselleWorkflowDesignerTextGenerationNode = XYFlowNode<
	{ nodeData: TextGenerationNode; preview?: boolean },
	TextGenerationNode["content"]["type"]
>;
type GiselleWorkflowDesignerTextNode = XYFlowNode<
	{ nodeData: TextNode; preview?: boolean },
	TextNode["content"]["type"]
>;
type GiselleWorkflowDesignerFileNode = XYFlowNode<
	{ nodeData: FileNode; preview?: boolean },
	FileNode["content"]["type"]
>;
type GiselleWorkflowGitHubNode = XYFlowNode<
	{ nodeData: GitHubNode; preview?: boolean },
	FileNode["content"]["type"]
>;
export type GiselleWorkflowDesignerNode =
	| GiselleWorkflowDesignerTextGenerationNode
	| GiselleWorkflowDesignerTextNode
	| GiselleWorkflowDesignerFileNode
	| GiselleWorkflowGitHubNode;

export const nodeTypes: NodeTypes = {
	[TextGenerationNode.shape.content.shape.type._def.value]: CustomXyFlowNode,
	[TextNode.shape.content.shape.type._def.value]: CustomXyFlowNode,
	[FileNode.shape.content.shape.type._def.value]: CustomXyFlowNode,
	[GitHubNode.shape.content.shape.type._def.value]: CustomXyFlowNode,
};

export function CustomXyFlowNode({
	data,
	selected,
}: NodeProps<GiselleWorkflowDesignerNode>) {
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const hasTarget = useMemo(
		() =>
			workspace.connections.some(
				(connection) => connection.outputNode.id === data.nodeData.id,
			),
		[workspace, data.nodeData.id],
	);
	const connectedOutputIds = useMemo(
		() =>
			workspace.connections
				.filter((connection) => connection.outputNode.id === data.nodeData.id)
				.map((connection) => connection.outputId),
		[workspace, data.nodeData.id],
	);

	return (
		<NodeComponent
			node={data.nodeData}
			selected={selected}
			connectedOutputIds={connectedOutputIds}
		/>
	);
}

export function NodeComponent({
	node,
	selected,
	connectedOutputIds,
	preview = false,
}: {
	node: Node;
	selected?: boolean;
	preview?: boolean;
	connectedOutputIds?: OutputId[];
}) {
	return (
		<div
			data-type={node.type}
			data-content-type={node.content.type}
			data-selected={selected}
			data-preview={preview}
			className={clsx(
				"group relative flex flex-col rounded-[16px] py-[16px] gap-[16px] min-w-[180px]",
				"bg-gradient-to-tl transition-shadow backdrop-blur-[4px]",
				"data-[content-type=text]:from-text-node-1] data-[content-type=text]:to-text-node-2 data-[content-type=text]:shadow-text-node-1",
				"data-[content-type=file]:from-file-node-1] data-[content-type=file]:to-file-node-2 data-[content-type=file]:shadow-file-node-1",
				"data-[content-type=textGeneration]:from-generation-node-1] data-[content-type=textGeneration]:to-generation-node-2 data-[content-type=textGeneration]:shadow-generation-node-1",
				"data-[content-type=github]:from-github-node-1] data-[content-type=github]:to-github-node-2 data-[content-type=github]:shadow-github-node-1",
				"data-[selected=true]:shadow-[0px_0px_16px_0px]",
				"data-[preview=true]:opacity-50",
				"not-data-preview:min-h-[110px]",
			)}
		>
			<div
				className={clsx(
					"absolute z-0 rounded-[16px] inset-0 border-[1.5px] mask-fill bg-gradient-to-br bg-origin-border bg-clip-boarder border-transparent",
					"group-data-[content-type=text]:from-text-node-1/40 group-data-[content-type=text]:to-text-node-1",
					"group-data-[content-type=file]:from-file-node-1/40 group-data-[content-type=file]:to-file-node-1",
					"group-data-[content-type=textGeneration]:from-generation-node-1/40 group-data-[content-type=textGeneration]:to-generation-node-1",
					"group-data-[content-type=github]:from-github-node-1/40 group-data-[content-type=github]:to-github-node-1",
				)}
			/>

			{/* <NodeNameEditable
				name={data.nodeData.name}
				onNodeNameChange={(name) => {
					updateNodeData(data.nodeData, { name });
				}}
			/> */}
			<div className={clsx("px-[16px]")}>
				<div className="flex items-center gap-[8px]">
					<div
						className={clsx(
							"w-[32px] h-[32px] flex items-center justify-center rounded-[8px] padding-[8px]",
							"group-data-[content-type=text]:bg-text-node-1",
							"group-data-[content-type=file]:bg-file-node-1",
							"group-data-[content-type=textGeneration]:bg-generation-node-1",
							"group-data-[content-type=github]:bg-github-node-1",
						)}
					>
						<NodeIcon
							node={node}
							className={clsx(
								"w-[16px] h-[16px] fill-current",
								"group-data-[content-type=text]:text-black-900",
								"group-data-[content-type=file]:text-black-900",
								"group-data-[content-type=textGeneration]:text-white-900",
								"group-data-[content-type=github]:text-white-900",
							)}
						/>
					</div>
					<div>
						<div className="font-rosart text-[14px] text-white-900">
							{defaultName(node)}
						</div>
						{node.type === "action" && (
							<div className="text-[10px] text-white-400">
								{node.content.llm.provider}
							</div>
						)}
					</div>
				</div>
			</div>
			{!preview && (
				<div className="flex justify-between">
					<div className="grid">
						{node.inputs?.map((input) => (
							<div
								className="relative flex items-center h-[28px]"
								key={input.id}
							>
								<Handle
									type="target"
									position={Position.Left}
									id={input.id}
									className={clsx(
										"!absolute !w-[11px] !h-[11px] !rounded-full !-left-[5px] !translate-x-[50%] !border-[1.5px]",
										"group-data-[content-type=textGeneration]:!bg-generation-node-1 group-data-[content-type=textGeneration]:!border-generation-node-1",
									)}
								/>
								<div className="text-[14px] text-black--30 px-[12px] text-white-900">
									{input.label}
								</div>
							</div>
						))}
					</div>

					<div className="grid">
						{node.outputs?.map((output) => (
							<div
								className="relative flex items-center h-[28px]"
								key={output.id}
							>
								<Handle
									id={output.id}
									type="source"
									position={Position.Right}
									data-state={
										connectedOutputIds?.some(
											(connectedOutputId) => connectedOutputId === output.id,
										)
											? "connected"
											: "disconnected"
									}
									className={clsx(
										"!absolute !w-[12px] !h-[12px] !rounded-full !border-[1.5px]",
										"group-data-[content-type=textGeneration]:!border-generation-node-1",
										"group-data-[content-type=github]:!border-github-node-1",
										"group-data-[content-type=text]:!border-text-node-1",
										"group-data-[content-type=file]:!border-file-node-1",
										"data-[state=connected]:group-data-[content-type=textGeneration]:!bg-generation-node-1",
										"data-[state=connected]:group-data-[content-type=github]:!bg-cgithub-node-1",
										"data-[state=connected]:group-data-[content-type=text]:!bg-text-node-1 data-[state=connected]:group-data-[content-type=text]:!border-text-node-1",
										"data-[state=connected]:group-data-[content-type=file]:!bg-file-node-1 data-[state=connected]:group-data-[content-type=file]:!border-file-node-1",
										"data-[state=disconnected]:!bg-black-900",
									)}
								/>
								<div className="text-[14px] px-[16px] text-white-900">
									{output.label}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
