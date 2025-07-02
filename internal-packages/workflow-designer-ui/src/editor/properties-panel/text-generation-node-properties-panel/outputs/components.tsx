import {
	isImageGenerationNode,
	isTextGenerationNode,
	OutputId,
	type TextGenerationNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import clsx from "clsx/lite";
import { CheckIcon, TrashIcon } from "lucide-react";
import { Popover, ToggleGroup } from "radix-ui";
import {
	type ComponentProps,
	type ReactNode,
	useCallback,
	useState,
} from "react";
import type { OutputWithDetails } from "./types";
import { useCategoriedOutputs } from "./use-categoried-outputs";

function OutputToggleItem({
	input,
	disabled = false,
}: {
	input: OutputWithDetails;
	disabled?: boolean;
}) {
	const getDisplayName = () => {
		if (isTextGenerationNode(input.node) || isImageGenerationNode(input.node)) {
			return input.node.name ?? input.node.content.llm.id;
		}
		return input.node.name ?? "Source";
	};

	return (
		<ToggleGroup.Item
			key={input.id}
			className={clsx(
				"group flex p-[8px] justify-between rounded-[8px] hover:bg-primary-900/50 transition-colors cursor-pointer",
				"text-white-400",
				"data-[disabled]:text-white-850/30 data-[disabled]:pointer-events-none",
			)}
			value={input.id}
			disabled={disabled}
		>
			<p className="text-[12px] truncate">
				{getDisplayName()} / {input.label}
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

export function SelectOutputPopover({
	node,
	outputs,
	onValueChange,
	contentProps,
}: {
	node: TextGenerationNode;
	outputs: OutputWithDetails[];
	onValueChange?: (value: OutputId[]) => void;
	contentProps?: Omit<
		ComponentProps<typeof Popover.PopoverContent>,
		"className"
	>;
}) {
	const [selectedOutputIds, setSelectedOutputIds] = useState<OutputId[]>([]);
	const {
		generatedInputs,
		textInputs,
		fileInputs,
		githubInputs,
		actionInputs,
		triggerInputs,
		queryInputs,
	} = useCategoriedOutputs(outputs);
	const { isSupportedConnection } = useWorkflowDesigner();
	const isSupported = useCallback(
		(input: OutputWithDetails) => {
			const { canConnect } = isSupportedConnection(input.node, node);
			return canConnect;
		},
		[isSupportedConnection, node],
	);

	return (
		<Popover.Root
			onOpenChange={(open) => {
				if (open) {
					setSelectedOutputIds(
						outputs
							.filter((input) => input.connection !== undefined)
							.map((input) => input.id),
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
							{triggerInputs.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Action
									</p>
									{triggerInputs.map((triggerInput) => (
										<OutputToggleItem
											key={triggerInput.id}
											input={triggerInput}
											disabled={!isSupported(triggerInput)}
										/>
									))}
								</div>
							)}
							{generatedInputs.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Generated Content
									</p>
									{generatedInputs.map((generatedInput) => (
										<OutputToggleItem
											key={generatedInput.id}
											input={generatedInput}
											disabled={!isSupported(generatedInput)}
										/>
									))}
								</div>
							)}
							{textInputs.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Text
									</p>
									{textInputs.map((textInput) => (
										<OutputToggleItem
											key={textInput.id}
											input={textInput}
											disabled={!isSupported(textInput)}
										/>
									))}
								</div>
							)}

							{fileInputs.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										File
									</p>
									{fileInputs.map((fileInput) => (
										<OutputToggleItem
											key={fileInput.id}
											input={fileInput}
											disabled={!isSupported(fileInput)}
										/>
									))}
								</div>
							)}
							{githubInputs.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										GitHub
									</p>
									{githubInputs.map((githubInput) => (
										<OutputToggleItem
											key={githubInput.id}
											input={githubInput}
											disabled={!isSupported(githubInput)}
										/>
									))}
								</div>
							)}
							{actionInputs.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Action
									</p>
									{actionInputs.map((actionInput) => (
										<OutputToggleItem
											key={actionInput.id}
											input={actionInput}
											disabled={!isSupported(actionInput)}
										/>
									))}
								</div>
							)}
							{queryInputs.length > 0 && (
								<div className="flex flex-col px-[8px]">
									<p className="py-[4px] px-[8px] text-black-400 text-[10px] font-[700]">
										Query
									</p>
									{queryInputs.map((queryInput) => (
										<OutputToggleItem
											key={queryInput.id}
											input={queryInput}
											disabled={!isSupported(queryInput)}
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

export function ConnectedOutputListRoot({
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
export function ConnectedOutputListItem({
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
					<p className="text-[16px]">{title}</p>
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
