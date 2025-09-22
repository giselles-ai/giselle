import {
	type Connection,
	type ImageGenerationNode,
	type Input,
	InputId,
	isFileNode,
	isImageGenerationNode,
	isTextGenerationNode,
	isTextNode,
	OutputId,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselle-sdk/text-editor-utils";
import clsx from "clsx/lite";
import { CheckIcon, DatabaseZapIcon, TrashIcon } from "lucide-react";
import pluralize from "pluralize";
import { Popover, ToggleGroup } from "radix-ui";
import {
	type ComponentProps,
	type ReactNode,
	useCallback,
	useMemo,
	useState,
} from "react";
import { GeneratedContentIcon, PdfFileIcon, PromptIcon } from "../../../icons";
import { EmptyState } from "../../../ui/empty-state";
import {
	type Source,
	useConnectedSources,
	useSourceCategories,
} from "./sources";

function SourceToggleItem({
	source,
	disabled = false,
}: {
	source: Source;
	disabled?: boolean;
}) {
	const getDisplayName = () => {
		if (
			isTextGenerationNode(source.node) ||
			isImageGenerationNode(source.node)
		) {
			return source.node.name ?? source.node.content.llm.id;
		}
		return source.node.name ?? "Source";
	};

	return (
		<ToggleGroup.Item
			key={source.output.id}
			className={clsx(
				"group flex p-[8px] justify-between rounded-[8px] hover:bg-primary-900/50 transition-colors cursor-pointer",
				"text-white-400",
				"data-[disabled]:text-white-850/30 data-[disabled]:pointer-events-none",
			)}
			value={source.output.id}
			disabled={disabled}
		>
			<p className="text-[12px] truncate">
				{getDisplayName()} / {source.output.label}
			</p>
			<CheckIcon className="w-[16px] h-[16px] hidden group-data-[state=on]:block" />
			<div
				className={clsx(
					"px-[10px] py-[4px] flex items-center justify-center rounded-[30px]",
					"bg-black-200/20 text-black-200/20 text-[10px]",
					"hidden group-data-[disabled]:block",
				)}
			>
				Unsupported
			</div>
		</ToggleGroup.Item>
	);
}

function SourceSelect({
	node,
	sources,
	onValueChange,
	contentProps,
}: {
	node: ImageGenerationNode;
	sources: Source[];
	onValueChange?: (value: OutputId[]) => void;
	contentProps?: Omit<
		ComponentProps<typeof Popover.PopoverContent>,
		"className"
	>;
}) {
	const [selectedOutputIds, setSelectedOutputIds] = useState<OutputId[]>([]);
	const {
		generatedSources,
		textSources,
		fileSources,
		githubSources,
		querySources,
	} = useSourceCategories(sources);
	const { isSupportedConnection } = useWorkflowDesigner();
	const isSupported = useCallback(
		(source: Source) => {
			const { canConnect } = isSupportedConnection(source.node, node);
			return canConnect;
		},
		[isSupportedConnection, node],
	);

	return (
		<Popover.Root
			onOpenChange={(open) => {
				if (open) {
					setSelectedOutputIds(
						sources
							.filter((source) => source.connection !== undefined)
							.map((source) => source.output.id),
					);
				}
			}}
		>
			<Popover.Trigger
				className={clsx(
					"flex items-center cursor-pointer p-[10px] rounded-[8px]",
					"border border-transparent hover:border-white-800",
					"text-[12px] font-[700] text-white-800",
					"transition-colors",
				)}
			>
				Select Sources
			</Popover.Trigger>
			<Popover.Anchor />
			<Popover.Portal>
				<Popover.Content
					className={clsx(
						"relative w-[300px] py-[8px]",
						"rounded-[8px] border-[1px] bg-black-900/60 backdrop-blur-[8px]",
						"shadow-[-2px_-1px_0px_0px_rgba(0,0,0,0.1),1px_1px_8px_0px_rgba(0,0,0,0.25)]",
					)}
					{...contentProps}
				>
					<div
						className={clsx(
							"absolute z-0 rounded-[8px] inset-0 border-[1px] mask-fill bg-gradient-to-br bg-origin-border bg-clip-boarder border-transparent",
							"from-[hsl(232,_36%,_72%)]/40 to-[hsl(218,_58%,_21%)]/90",
						)}
					/>
					<ToggleGroup.Root
						type="multiple"
						className="relative max-h-[300px] flex flex-col"
						value={selectedOutputIds}
						onValueChange={(unsafeValue) => {
							const safeValue = unsafeValue
								.map((value) => {
									const parse = OutputId.safeParse(value);
									if (parse.success) {
										return parse.data;
									}
									return null;
								})
								.filter((id) => id !== null);
							setSelectedOutputIds(safeValue);
						}}
					>
						<div className="flex px-[16px] text-white-900">
							Select Sources From
						</div>
						<div className="flex flex-col py-[4px]">
							<div className="border-t border-black-300/20" />
						</div>
						<div className="grow flex flex-col pb-[8px] gap-[8px] overflow-y-auto min-h-0">
							{generatedSources.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Generated Content
									</p>
									{generatedSources.map((generatedSource) => (
										<SourceToggleItem
											key={generatedSource.output.id}
											source={generatedSource}
											disabled={!isSupported(generatedSource)}
										/>
									))}
								</div>
							)}
							{textSources.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Text
									</p>
									{textSources.map((textSource) => (
										<SourceToggleItem
											key={textSource.output.id}
											source={textSource}
											disabled={!isSupported(textSource)}
										/>
									))}
								</div>
							)}

							{fileSources.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										File
									</p>
									{fileSources.map((fileSource) => (
										<SourceToggleItem
											key={fileSource.output.id}
											source={fileSource}
											disabled={!isSupported(fileSource)}
										/>
									))}
								</div>
							)}
							{githubSources.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										GitHub
									</p>
									{githubSources.map((githubSource) => (
										<SourceToggleItem
											key={githubSource.output.id}
											source={githubSource}
											disabled={!isSupported(githubSource)}
										/>
									))}
								</div>
							)}
							{querySources.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Query
									</p>
									{querySources.map((querySource) => (
										<SourceToggleItem
											key={querySource.output.id}
											source={querySource}
											disabled={!isSupported(querySource)}
										/>
									))}
								</div>
							)}
						</div>
						<div className="flex flex-col py-[4px]">
							<div className="border-t border-black-300/20" />
						</div>
						<div className="flex px-[16px] py-[4px] gap-[8px]">
							<Popover.Close
								onClick={() => {
									onValueChange?.(selectedOutputIds);
								}}
								className="h-[32px] w-full flex justify-center items-center bg-white-900 text-black-900 rounded-[8px] cursor-pointer text-[12px]"
							>
								Update
							</Popover.Close>
						</div>
					</ToggleGroup.Root>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}

function SourceListRoot({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-[8px]">
			<p className="text-[14px]">{title}</p>
			{children}
		</div>
	);
}
function SourceListItem({
	icon,
	title,
	subtitle,
	onRemove,
}: {
	icon: ReactNode;
	title: string;
	subtitle: string;
	onRemove: () => void;
}) {
	return (
		<div
			className={clsx(
				"group flex items-center",
				"border border-white-900/20 rounded-[8px] h-[60px]",
			)}
		>
			<div className="w-[60px] flex items-center justify-center">{icon}</div>
			<div className="w-[1px] h-full border-l border-white-900/20" />
			<div className="px-[16px] flex-1 flex items-center justify-between">
				<div className="flex flex-col gap-[4px]">
					<p className="text=[16px]">{title}</p>
					<div className="text-[10px] text-black-400">
						<p className="line-clamp-1">{subtitle}</p>
					</div>
				</div>
				<button
					type="button"
					className={clsx(
						"hidden group-hover:block",
						"p-[4px] rounded-[4px]",
						"bg-transparent hover:bg-black-300/50 transition-colors",
					)}
					onClick={onRemove}
				>
					<TrashIcon className="w-[18px] h-[18px] text-white-900" />
				</button>
			</div>
		</div>
	);
}

export function InputPanel({
	node: imageGenerationNode,
}: {
	node: ImageGenerationNode;
}) {
	const { data, addConnection, deleteConnection, updateNodeData } =
		useWorkflowDesigner();
	const sources = useMemo<Source[]>(() => {
		const tmpSources: Source[] = [];
		const connections = data.connections.filter(
			(connection) => connection.inputNode.id === imageGenerationNode.id,
		);
		for (const node of data.nodes) {
			if (node.id === imageGenerationNode.id) {
				continue;
			}
			for (const output of node.outputs) {
				const connection = connections.find(
					(connection) => connection.outputId === output.id,
				);
				tmpSources.push({
					output,
					node,
					connection,
				});
			}
		}
		return tmpSources;
	}, [data.nodes, data.connections, imageGenerationNode.id]);
	const connectedSources = useConnectedSources(imageGenerationNode);

	const handleConnectionChange = useCallback(
		(connectOutputIds: OutputId[]) => {
			const currentConnectedOutputIds = data.connections
				.filter(
					(connection) => connection.inputNode.id === imageGenerationNode.id,
				)
				.map((connection) => connection.outputId);
			const newConnectOutputIdSet = new Set(connectOutputIds);
			const currentConnectedOutputIdSet = new Set(currentConnectedOutputIds);
			const addedOutputIdSet = newConnectOutputIdSet.difference(
				currentConnectedOutputIdSet,
			);

			let mutableInputs = imageGenerationNode.inputs;
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
				updateNodeData(imageGenerationNode, {
					inputs: mutableInputs,
				});
				addConnection({
					inputNode: imageGenerationNode,
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
						connection.inputNode.id === imageGenerationNode.id &&
						connection.outputId === outputId,
				);
				if (connection === undefined) {
					continue;
				}
				deleteConnection(connection.id);

				mutableInputs = mutableInputs.filter(
					(input) => input.id !== connection.inputId,
				);
				updateNodeData(imageGenerationNode, {
					inputs: mutableInputs,
				});
			}
		},
		[
			imageGenerationNode,
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
			updateNodeData(imageGenerationNode, {
				inputs: imageGenerationNode.inputs.filter(
					(input) => input.id !== connection.inputId,
				),
			});
		},
		[imageGenerationNode, deleteConnection, updateNodeData],
	);

	if (imageGenerationNode.inputs.length === 0) {
		return (
			<div className="mt-[60px]">
				<EmptyState
					title="No data referenced yet."
					description="Select the data you want to refer to from the output and the information and knowledge you have."
				>
					<SourceSelect
						node={imageGenerationNode}
						sources={sources}
						onValueChange={handleConnectionChange}
					/>
				</EmptyState>
			</div>
		);
	}
	return (
		<div>
			<div className="flex justify-end">
				<SourceSelect
					node={imageGenerationNode}
					sources={sources}
					onValueChange={handleConnectionChange}
					contentProps={{
						align: "end",
					}}
				/>
			</div>
			<div className="flex flex-col gap-[32px]">
				{connectedSources.generationText.length > 0 && (
					<SourceListRoot title="Generated Text Sources">
						{connectedSources.generationText.map((source) => (
							<SourceListItem
								icon={
									<GeneratedContentIcon className="size-[24px] text-white-900" />
								}
								key={source.connection.id}
								title={`${source.node.name ?? source.node.content.llm.id} / ${source.output.label}`}
								subtitle={source.node.content.llm.provider}
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</SourceListRoot>
				)}
				{connectedSources.generationImage.length > 0 && (
					<SourceListRoot title="Generated Image Sources">
						{connectedSources.generationImage.map((source) => (
							<SourceListItem
								key={source.connection.id}
								icon={
									<GeneratedContentIcon className="size-[24px] text-white-900" />
								}
								title={`${source.node.name ?? source.node.content.llm.id} / ${source.output.label}`}
								subtitle={source.node.content.llm.provider}
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</SourceListRoot>
				)}
				{connectedSources.variable.length > 0 && (
					<SourceListRoot title="Static Contents">
						{connectedSources.variable.map((source) => {
							switch (source.node.content.type) {
								case "text": {
									if (!isTextNode(source.node)) {
										throw new Error(
											`Expected text node, got ${source.node.content.type}`,
										);
									}
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
										<SourceListItem
											icon={
												<PromptIcon className="size-[24px] text-white-900" />
											}
											key={source.connection.id}
											title={`${source.node.name ?? "Text"} / ${source.output.label}`}
											subtitle={text}
											onRemove={() => handleRemove(source.connection)}
										/>
									);
								}
								case "file":
									if (!isFileNode(source.node)) {
										throw new Error(
											`Expected file node, got ${source.node.content.type}`,
										);
									}
									return (
										<SourceListItem
											icon={
												<PdfFileIcon className="size-[24px] text-white-900" />
											}
											key={source.connection.id}
											title={`${source.node.name ?? "PDF Files"} / ${source.output.label}`}
											subtitle={`${source.node.content.files.length} ${pluralize("file", source.node.content.files.length)}`}
											onRemove={() => handleRemove(source.connection)}
										/>
									);
								case "github":
									throw new Error("github node is deprecated");
								case "vectorStore":
									throw new Error(
										"vectorStore node is not supported to connect.",
									);
								case "webPage":
									throw new Error("webPage node is not supported to connect.");
								default: {
									const _exhaustiveCheck: never = source.node.content;
									throw new Error(`Unhandled source type: ${_exhaustiveCheck}`);
								}
							}
						})}
					</SourceListRoot>
				)}
				{connectedSources.query.length > 0 && (
					<SourceListRoot title="Query Sources">
						{connectedSources.query.map((source) => (
							<SourceListItem
								key={source.connection.id}
								icon={
									<DatabaseZapIcon className="size-[24px] text-white-900" />
								}
								title={`${source.node.name ?? "Query"} / ${source.output.label}`}
								subtitle=""
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</SourceListRoot>
				)}
			</div>
		</div>
	);
}
