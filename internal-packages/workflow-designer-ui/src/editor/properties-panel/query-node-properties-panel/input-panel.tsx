import {
	type Connection,
	type Input,
	InputId,
	isImageGenerationNode,
	isTextGenerationNode,
	OutputId,
	type QueryNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import {
	isJsonContent,
	jsonContentToText,
} from "@giselle-sdk/text-editor-utils";
import clsx from "clsx/lite";
import {
	CheckIcon,
	DatabaseZapIcon,
	TrashIcon,
	WorkflowIcon,
} from "lucide-react";
import { Popover, ToggleGroup } from "radix-ui";
import {
	type ComponentProps,
	type ReactNode,
	useCallback,
	useMemo,
	useState,
} from "react";
import {
	GeneratedContentIcon,
	GitHubIcon,
	PromptIcon,
	TriggerIcon,
} from "../../../icons";
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
	node: QueryNode;
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
		datastoreSources,
		actionSources,
		triggerSources,
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
							{datastoreSources.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Datastore
									</p>
									{datastoreSources.map((datastoreSource) => (
										<SourceToggleItem
											key={datastoreSource.output.id}
											source={datastoreSource}
											disabled={!isSupported(datastoreSource)}
										/>
									))}
								</div>
							)}
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

							{actionSources.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Action
									</p>
									{actionSources.map((actionSource) => (
										<SourceToggleItem
											key={actionSource.output.id}
											source={actionSource}
											disabled={!isSupported(actionSource)}
										/>
									))}
								</div>
							)}
							{triggerSources.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Trigger
									</p>
									{triggerSources.map((triggerSource) => (
										<SourceToggleItem
											key={triggerSource.output.id}
											source={triggerSource}
											disabled={!isSupported(triggerSource)}
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

export function InputPanel({ node: queryNode }: { node: QueryNode }) {
	const { data, addConnection, deleteConnection, updateNodeData } =
		useWorkflowDesigner();
	const sources = useMemo<Source[]>(() => {
		const tmpSources: Source[] = [];
		const connections = data.connections.filter(
			(connection) => connection.inputNode.id === queryNode.id,
		);
		for (const node of data.nodes) {
			if (node.id === queryNode.id) {
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
	}, [data.nodes, data.connections, queryNode.id]);
	const connectedSources = useConnectedSources(queryNode);

	const handleConnectionChange = useCallback(
		(connectOutputIds: OutputId[]) => {
			const currentConnectedOutputIds = data.connections
				.filter((connection) => connection.inputNode.id === queryNode.id)
				.map((connection) => connection.outputId);
			const newConnectOutputIdSet = new Set(connectOutputIds);
			const currentConnectedOutputIdSet = new Set(currentConnectedOutputIds);
			const addedOutputIdSet = newConnectOutputIdSet.difference(
				currentConnectedOutputIdSet,
			);

			let mutableInputs = queryNode.inputs;
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
				updateNodeData(queryNode, {
					inputs: mutableInputs,
				});
				addConnection({
					inputNode: queryNode,
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
						connection.inputNode.id === queryNode.id &&
						connection.outputId === outputId,
				);
				if (connection === undefined) {
					continue;
				}
				deleteConnection(connection.id);

				mutableInputs = mutableInputs.filter(
					(input) => input.id !== connection.inputId,
				);
				updateNodeData(queryNode, {
					inputs: mutableInputs,
				});
			}
		},
		[
			queryNode,
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
			updateNodeData(queryNode, {
				inputs: queryNode.inputs.filter(
					(input) => input.id !== connection.inputId,
				),
			});
		},
		[queryNode, deleteConnection, updateNodeData],
	);

	if (queryNode.inputs.length === 0) {
		return (
			<div className="mt-[60px]">
				<EmptyState
					title="No data referenced yet."
					description="Select the data you want to refer to from the output and the information and knowledge you have."
				>
					<SourceSelect
						node={queryNode}
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
					node={queryNode}
					sources={sources}
					onValueChange={handleConnectionChange}
					contentProps={{
						align: "end",
					}}
				/>
			</div>
			<div className="flex flex-col gap-[32px]">
				{connectedSources.datastore.length > 0 && (
					<SourceListRoot title="Datastore Sources">
						{connectedSources.datastore.map((source) => (
							<SourceListItem
								icon={
									<DatabaseZapIcon className="size-[24px] text-white-900" />
								}
								key={source.connection.id}
								title={`${source.node.name ?? "Datastore"} / ${source.output.label}`}
								subtitle={source.node.content.source.provider}
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</SourceListRoot>
				)}
				{connectedSources.generation.length > 0 && (
					<SourceListRoot title="Generated Sources">
						{connectedSources.generation.map((source) => (
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
				{connectedSources.action.length > 0 && (
					<SourceListRoot title="Action Sources">
						{connectedSources.action.map((source) => (
							<SourceListItem
								icon={
									source.node.content.command.provider === "github" ? (
										<GitHubIcon className="size-[24px] text-white-900" />
									) : (
										<WorkflowIcon className="size-[24px] text-white-900" />
									)
								}
								key={source.connection.id}
								title={`${source.node.name ?? "Action"} / ${source.output.label}`}
								subtitle={source.node.content.command.provider}
								onRemove={() => handleRemove(source.connection)}
							/>
						))}
					</SourceListRoot>
				)}
				{connectedSources.trigger.length > 0 && (
					<SourceListRoot title="Trigger Sources">
						{connectedSources.trigger.map((source) => (
							<SourceListItem
								icon={
									source.node.content.provider === "github" ? (
										<GitHubIcon className="size-[24px] text-white-900" />
									) : (
										<TriggerIcon className="size-[24px] text-white-900" />
									)
								}
								key={source.connection.id}
								title={`${source.node.name ?? "Trigger"} / ${source.output.label}`}
								subtitle={source.node.content.provider}
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
									let text = source.node.content.text;
									if (text.length > 0) {
										try {
											const jsonContentLikeString = JSON.parse(
												source.node.content.text,
											);
											if (isJsonContent(jsonContentLikeString)) {
												text = jsonContentToText(jsonContentLikeString);
											}
										} catch (e) {
											// Ignore JSON parsing error, keep the original text
											console.warn(
												"Failed to parse text content as JSON, using original text: ",
												e,
											);
											return text;
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
								case "github":
									return (
										<SourceListItem
											icon={
												<GitHubIcon className="size-[24px] text-white-900" />
											}
											key={source.connection.id}
											title={`${source.node.name ?? "GitHub"} / ${source.output.label}`}
											subtitle="GitHub"
											onRemove={() => handleRemove(source.connection)}
										/>
									);
								case "vectorStore":
									return (
										<SourceListItem
											icon={
												<DatabaseZapIcon className="size-[24px] text-white-900" />
											}
											key={source.connection.id}
											title={`${source.node.name ?? "Vector Store"} / ${source.output.label}`}
											subtitle={`${source.node.content.source.provider} / ${source.node.content.source.state.status}`}
											onRemove={() => handleRemove(source.connection)}
										/>
									);
								case "file":
								case "webPage":
									break;
								default: {
									const _exhaustiveCheck: never = source.node.content;
									throw new Error(`Unhandled source type: ${_exhaustiveCheck}`);
								}
							}
						})}
					</SourceListRoot>
				)}
			</div>
		</div>
	);
}
