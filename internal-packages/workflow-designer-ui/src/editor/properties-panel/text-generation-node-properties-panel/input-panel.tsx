import {
	type Connection,
	type Input,
	InputId,
	type OutputId,
	type TextGenerationNode,
} from "@giselle-sdk/data-type";
import { defaultName } from "@giselle-sdk/node-utils";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselle-sdk/text-editor-utils";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { DatabaseZapIcon } from "lucide-react";
import pluralize from "pluralize";
import { useCallback, useMemo } from "react";
import {
	GeneratedContentIcon,
	GitHubIcon,
	PdfFileIcon,
	PromptIcon,
	WebPageFileIcon,
} from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import {
	ConnectedOutputListItem,
	ConnectedOutputListRoot,
	type OutputWithDetails,
	SelectOutputPopover,
	useConnectedOutputs,
} from "./outputs";

export function InputPanel({
	node: textGenerationNode,
}: {
	node: TextGenerationNode;
}) {
	const { data, addConnection, deleteConnection, updateNodeData } =
		useWorkflowDesigner();
	const outputs = useMemo<OutputWithDetails[]>(() => {
		const tmp: OutputWithDetails[] = [];
		const connectionToThisNode = data.connections.filter(
			(connection) => connection.inputNode.id === textGenerationNode.id,
		);
		for (const node of data.nodes) {
			if (node.id === textGenerationNode.id) {
				continue;
			}
			for (const output of node.outputs) {
				const connection = connectionToThisNode.find(
					(connection) =>
						connection.outputId === output.id &&
						connection.outputNode.id === node.id,
				);
				tmp.push({
					...output,
					node,
					connection,
				});
			}
		}
		return tmp;
	}, [data.nodes, data.connections, textGenerationNode.id]);
	const connectedOutputs = useConnectedOutputs(textGenerationNode);

	const handleConnectionChange = useCallback(
		(connectOutputIds: OutputId[]) => {
			const currentConnectedOutputIds = data.connections
				.filter(
					(connection) => connection.inputNode.id === textGenerationNode.id,
				)
				.map((connection) => connection.outputId);
			const newConnectOutputIdSet = new Set(connectOutputIds);
			const currentConnectedOutputIdSet = new Set(currentConnectedOutputIds);
			const addedOutputIdSet = newConnectOutputIdSet.difference(
				currentConnectedOutputIdSet,
			);

			let mutableInputs = textGenerationNode.inputs;
			for (const outputId of addedOutputIdSet) {
				const outputNode = data.nodes.find((node) =>
					node.outputs.some((output) => output.id === outputId),
				);
				if (outputNode === undefined) {
					continue;
				}
				const newInputId = InputId.generate();
				const newInput: Input = {
					id: newInputId,
					label: "Input",
					accessor: newInputId,
				};

				mutableInputs = [...mutableInputs, newInput];
				updateNodeData(textGenerationNode, {
					inputs: mutableInputs,
				});
				addConnection({
					inputNode: textGenerationNode,
					inputId: newInput.id,
					outputId,
					outputNode: outputNode,
				});
			}

			const removedOutputIdSet = currentConnectedOutputIdSet.difference(
				newConnectOutputIdSet,
			);

			for (const outputId of removedOutputIdSet) {
				const connection = data.connections.find(
					(connection) =>
						connection.inputNode.id === textGenerationNode.id &&
						connection.outputId === outputId,
				);
				if (connection === undefined) {
					continue;
				}
				deleteConnection(connection.id);

				mutableInputs = mutableInputs.filter(
					(input) => input.id !== connection.inputId,
				);
				updateNodeData(textGenerationNode, {
					inputs: mutableInputs,
				});
			}
		},
		[
			textGenerationNode,
			data.nodes,
			data.connections,
			addConnection,
			deleteConnection,
			updateNodeData,
		],
	);

	const handleRemove = useCallback(
		(connection: Connection) => {
			deleteConnection(connection.id);
			updateNodeData(textGenerationNode, {
				inputs: textGenerationNode.inputs.filter(
					(input) => input.id !== connection.inputId,
				),
			});
		},
		[textGenerationNode, deleteConnection, updateNodeData],
	);

	if (textGenerationNode.inputs.length === 0) {
		return (
			<div className="mt-[60px]">
				<EmptyState
					title="No data referenced yet."
					description="Select the data you want to refer to from the output and the information and knowledge you have."
				>
					<SelectOutputPopover
						node={textGenerationNode}
						outputs={outputs}
						onValueChange={handleConnectionChange}
					/>
				</EmptyState>
			</div>
		);
	}
	return (
		<div>
			<div className="flex justify-end">
				<SelectOutputPopover
					node={textGenerationNode}
					outputs={outputs}
					onValueChange={handleConnectionChange}
					contentProps={{
						align: "end",
					}}
				/>
			</div>
			<div className="flex flex-col gap-[32px]">
				{connectedOutputs.trigger.length > 0 && (
					<ConnectedOutputListRoot title="Generated Sources">
						{connectedOutputs.trigger.map((source) => (
							<ConnectedOutputListItem
								icon={
									<GeneratedContentIcon className="size-[24px] text-white-900" />
								}
								key={source.connection.id}
								title={source.node.name ?? defaultName(source.node)}
								subtitle=""
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</ConnectedOutputListRoot>
				)}
				{connectedOutputs.generation.length > 0 && (
					<ConnectedOutputListRoot title="Generated Sources">
						{connectedOutputs.generation.map((source) => (
							<ConnectedOutputListItem
								icon={
									<GeneratedContentIcon className="size-[24px] text-white-900" />
								}
								key={source.connection.id}
								title={`${source.node.name ?? source.node.content.llm.id} / ${source.label}`}
								subtitle={source.node.content.llm.provider}
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</ConnectedOutputListRoot>
				)}
				{connectedOutputs.action.length > 0 && (
					<ConnectedOutputListRoot title="Generated Sources">
						{connectedOutputs.action.map((source) => (
							<ConnectedOutputListItem
								icon={<GitHubIcon className="size-[24px] text-white-900" />}
								key={source.connection.id}
								title={source.node.name ?? defaultName(source.node)}
								subtitle={""}
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</ConnectedOutputListRoot>
				)}
				{connectedOutputs.variable.length > 0 && (
					<ConnectedOutputListRoot title="Static Contents">
						{connectedOutputs.variable.map((source) => {
							switch (source.node.content.type) {
								case "text": {
									let text = source.node.content.text;
									if (text.length > 0) {
										const jsonContentLikeString = JSON.parse(
											source.node.content.text,
										);
										if (isJsonContent(jsonContentLikeString)) {
											text = jsonContentToText(jsonContentLikeString);
										}
									}

									return (
										<ConnectedOutputListItem
											icon={
												<PromptIcon className="size-[24px] text-white-900" />
											}
											key={source.connection.id}
											title={`${source.node.name ?? "Text"} / ${source.label}`}
											subtitle={text}
											onRemove={() => handleRemove(source.connection)}
										/>
									);
								}
								case "file":
									return (
										<ConnectedOutputListItem
											icon={
												<PdfFileIcon className="size-[24px] text-white-900" />
											}
											key={source.connection.id}
											title={`${source.node.name ?? "PDF Files"} / ${source.label}`}
											subtitle={`${source.node.content.files.length} ${pluralize("file", source.node.content.files.length)}`}
											onRemove={() => handleRemove(source.connection)}
										/>
									);
								case "github":
									return (
										<ConnectedOutputListItem
											icon={
												<GitHubIcon className="size-[24px] text-white-900" />
											}
											key={source.connection.id}
											title={`${source.node.name ?? "GitHub"} / ${source.label}`}
											subtitle={"todo"}
											onRemove={() => handleRemove(source.connection)}
										/>
									);
								case "webPage":
									return (
										<ConnectedOutputListItem
											icon={
												<WebPageFileIcon className="size-[24px] text-white-900" />
											}
											key={source.connection.id}
											title={`${source.node.name ?? "WebPage"} / ${source.label}`}
											subtitle={""}
											onRemove={() => handleRemove(source.connection)}
										/>
									);

								case "vectorStore":
									throw new Error(
										"vectorStore node is not supported to connect.",
									);
								default: {
									const _exhaustiveCheck: never = source.node.content;
									throw new Error(`Unhandled source type: ${_exhaustiveCheck}`);
								}
							}
						})}
					</ConnectedOutputListRoot>
				)}
				{connectedOutputs.query.length > 0 && (
					<ConnectedOutputListRoot title="Query Sources">
						{connectedOutputs.query.map((source) => (
							<ConnectedOutputListItem
								key={source.connection.id}
								icon={
									<DatabaseZapIcon className="size-[24px] text-white-900" />
								}
								title={`${source.node.name ?? "Query"} / ${source.label}`}
								subtitle=""
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</ConnectedOutputListRoot>
				)}
			</div>
		</div>
	);
}
