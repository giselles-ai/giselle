"use client";
import {
	type Generation,
	type TriggerNode,
	TriggerProvider,
	type WorkspaceId,
	isTriggerNode,
	isTriggerProvider,
} from "@giselle-sdk/data-type";
import { useGenerationRunnerSystem } from "@giselle-sdk/giselle-engine/react";
import { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import clsx from "clsx";
import {
	ViewState,
	useFeatureFlag,
	useWorkflowDesigner,
} from "giselle-sdk/react";
import {
	CableIcon,
	ChevronDownIcon,
	CirclePlayIcon,
	EyeIcon,
	GanttChartIcon,
	PlayIcon,
} from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { Dialog, ToggleGroup, VisuallyHidden } from "radix-ui";
import {
	type ButtonHTMLAttributes,
	type ReactNode,
	useCallback,
	useMemo,
	useState,
} from "react";
import { EditableText } from "../editor/properties-panel/ui";
import { GiselleLogo } from "../icons";
import { SettingsPanel } from "../settings";
import { ShareButton } from "../ui/button";
import { ReadOnlyBadge } from "../ui/read-only-banner";
import { ShareModal } from "../ui/share-modal";
import { UserPresence } from "../ui/user-presence";

function buttonLabel(triggerProvider: TriggerProvider) {
	switch (triggerProvider.type) {
		case "manual":
			return "Trigger Manual flow";
		case "github":
			return "Trigger GitHub flow";
		default: {
			const _exhaustiveCheck: never = triggerProvider;
			throw new Error(`Unhandled trigger provider type: ${_exhaustiveCheck}`);
		}
	}
}

function Button({
	leftIcon: LeftIcon,
	rightIcon: RightIcon,
	children,
	...props
}: {
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			className="bg-white-900 px-[8px] rounded-[4px] py-[4px] text-[14px] flex items-center gap-[4px] cursor-pointer outline-none"
			{...props}
		>
			{LeftIcon}
			<div>{children}</div>
			{RightIcon}
		</button>
	);
}

function TriggerButton({ triggerNode }: { triggerNode: TriggerNode }) {
	const { data } = useWorkflowDesigner();
	const triggerProvider = useMemo(() => {
		const parse = TriggerProvider.safeParse(triggerNode.content.provider);
		if (parse.success) {
			return parse.data;
		}
		return null;
	}, [triggerNode.content.provider]);
	const { createGeneration, startGeneration } = useGenerationRunnerSystem();
	const handleClick = useCallback(async () => {
		const flow = buildWorkflowFromNode(
			triggerNode.id,
			data.nodes,
			data.connections,
		);
		if (flow === null) {
			return;
		}
		const generations: Generation[] = [];
		flow.jobs.map((job) =>
			job.operations.map((operation) => {
				generations.push(
					createGeneration({
						origin: {
							type: "workspace",
							id: data.id,
						},
						...operation.generationTemplate,
					}),
				);
			}),
		);
		for (const job of flow.jobs) {
			for (const operation of job.operations) {
				const generation = generations.find(
					(generation) =>
						generation.context.operationNode.id ===
						operation.generationTemplate.operationNode.id,
				);
				if (generation === undefined) {
					continue;
				}
				await startGeneration(generation.id);
			}
		}
	}, [triggerNode.id, data, createGeneration, startGeneration]);

	if (triggerProvider === null) {
		return null;
	}
	return (
		<Button
			leftIcon={<PlayIcon className="size-[14px] fill-black-900" />}
			onClick={handleClick}
		>
			{buttonLabel(triggerProvider)}
		</Button>
	);
}

function Trigger() {
	const { data } = useWorkflowDesigner();

	const triggerNodes = useMemo(
		() => data.nodes.filter((node) => isTriggerNode(node)),
		[data.nodes],
	);
	if (triggerNodes.length === 0) {
		return null;
	}
	if (triggerNodes.length === 1) {
		return <TriggerButton triggerNode={triggerNodes[0]} />;
	}
	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<Button leftIcon={<ChevronDownIcon className="size-[16px]" />}>
					Select trigger
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="bg-white-800 px-[6px] py-[6px] rounded-[6px] text-[14px]"
					sideOffset={4}
					align="end"
				>
					{triggerNodes.map((triggerNode) => {
						if (!isTriggerProvider(triggerNode.content.provider)) {
							return null;
						}
						return (
							<DropdownMenu.Item
								key={triggerNode.id}
								className="text-black-900 outline-none hover:bg-black-300/20 px-[8px] cursor-pointer rounded-[4px] py-[2px]"
							>
								{buttonLabel(triggerNode.content.provider)}
							</DropdownMenu.Item>
						);
					})}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}

export function Header({
	action,
	onWorkflowNameChange,
	isReadOnly = false,
	/** @todo use feature flag provider instead of props */
	shareFeatureFlag = false,
}: {
	action?: ReactNode;
	onWorkflowNameChange?: (workspaceId: WorkspaceId, name: string) => void;
	isReadOnly?: boolean;
	/** @todo use feature flag provider instead of props */
	shareFeatureFlag?: boolean;
}) {
	const { data, updateName, view, setView } = useWorkflowDesigner();
	const [openSettings, setOpenSettings] = useState(false);
	const [openShareModal, setOpenShareModal] = useState(false);
	const { runV2 } = useFeatureFlag();

	const updateWorkflowName = (value?: string) => {
		if (!value) {
			return;
		}

		if (onWorkflowNameChange) {
			onWorkflowNameChange(data.id, value);
		}

		updateName(value);
	};

	return (
		<div className="h-[54px] pl-[24px] pr-[16px] flex items-center justify-between shrink-0">
			<div className="flex items-center gap-[8px] text-white-950">
				<Link href="/">
					<GiselleLogo className="fill-white-900 w-[70px] h-auto mt-[6px]" />
				</Link>
				<Divider />
				<div className="flex gap-[2px] group">
					{isReadOnly ? (
						<span className="py-[2px] px-[4px] text-white-900 text-[14px]">
							{data.name || "Untitled"}
						</span>
					) : (
						<EditableText
							fallbackValue="Untitled"
							onChange={updateWorkflowName}
							value={data.name}
						/>
					)}
				</div>

				{isReadOnly && (
					<>
						<Divider />
						<ReadOnlyBadge />
					</>
				)}
			</div>

			<div className="flex items-center gap-[12px]">
				{runV2 && (
					// <button
					// 	type="button"
					// 	className="rounded-[4px] bg-white-800 px-[12px] flex items-center justify-center py-[4px] text-[14px] gap-[4px] flex items-center justify-center cursor-pointer text-black-900"
					// >
					// 	<PlayIcon className="size-[14px]" />
					// 	<span>Trigger manual flow</span>
					// </button>
					<Trigger />
				)}
				{!runV2 && shareFeatureFlag && (
					<>
						<UserPresence />

						<ShareButton onClick={() => setOpenShareModal(true)} />
					</>
				)}
				{!runV2 && (
					<ToggleGroup.Root
						type="single"
						className="flex h-[33px] px-[8px] py-0 items-center justify-center rounded-[29px] overflow-hidden border border-[#20222F] bg-[rgba(18,23,35,0.20)]"
						onValueChange={(unsafeValue) => {
							const parse = ViewState.safeParse(unsafeValue);
							if (parse.success) {
								setView(ViewState.parse(parse.data));
							}
						}}
					>
						<ToggleGroup.Item
							value="editor"
							className={clsx(
								"relative rounded-[24px] transition-colors duration-300 ease-out",
								view === "editor"
									? "p-[1px]"
									: "inline-flex h-[25px] py-[4px] items-center gap-[4px] flex-shrink-0 rounded-[4px] text-[#616779] font-[700] font-accent text-[12px] hover:text-[#8990a5]",
							)}
							style={
								view === "editor"
									? {
											background: "linear-gradient(135deg, #64759B, #222835)",
										}
									: undefined
							}
							disabled={isReadOnly}
						>
							{view === "editor" && (
								<span className="absolute inset-[1px] bg-[#1B2333] rounded-[23px] z-0 animate-softFade" />
							)}
							<span
								className={
									view === "editor"
										? "relative z-10 text-primary-200 font-[700] font-accent text-[12px] py-[4px] px-[10px] inline-flex items-center"
										: ""
								}
							>
								Build
							</span>
						</ToggleGroup.Item>

						<span className="text-[#616779] font-[700] font-accent text-[12px] mx-1">
							,
						</span>

						<ToggleGroup.Item
							value="viewer"
							className={clsx(
								"relative rounded-[24px] transition-colors duration-300 ease-out",
								view === "viewer"
									? "p-[1px]"
									: "inline-flex h-[25px] py-[4px] items-center gap-[4px] flex-shrink-0 rounded-[4px] text-[#616779] font-[700] font-accent text-[12px] hover:text-[#8990a5]",
							)}
							style={
								view === "viewer"
									? {
											background: "linear-gradient(135deg, #64759B, #222835)",
										}
									: undefined
							}
						>
							{view === "viewer" && (
								<span className="absolute inset-[1px] bg-[#1B2333] rounded-[23px] z-0 animate-softFade" />
							)}
							<span
								className={
									view === "viewer"
										? "relative z-10 text-primary-200 font-[700] font-accent text-[12px] py-[4px] px-[10px] inline-flex items-center"
										: ""
								}
							>
								Preview
							</span>
						</ToggleGroup.Item>

						<span className="text-[#616779] font-[700] font-accent text-[12px] mx-1">
							,
						</span>

						<ToggleGroup.Item
							value="integrator"
							className={clsx(
								"relative rounded-[24px] transition-colors duration-300 ease-out",
								view === "integrator"
									? "p-[1px]"
									: "inline-flex h-[25px] py-[4px] items-center gap-[4px] flex-shrink-0 rounded-[4px] text-[#616779] font-[700] font-accent text-[12px] hover:text-[#8990a5]",
							)}
							style={
								view === "integrator"
									? {
											background: "linear-gradient(135deg, #64759B, #222835)",
										}
									: undefined
							}
							disabled={isReadOnly}
						>
							{view === "integrator" && (
								<span className="absolute inset-[1px] bg-[#1B2333] rounded-[23px] z-0 animate-softFade" />
							)}
							<span
								className={
									view === "integrator"
										? "relative z-10 text-primary-200 font-[700] font-accent text-[12px] py-[4px] px-[10px] inline-flex items-center"
										: ""
								}
							>
								Integrate
							</span>
						</ToggleGroup.Item>

						<span className="text-[#616779] font-[700] font-accent text-[12px] mx-1">
							.
						</span>
					</ToggleGroup.Root>
				)}

				{action && <div className="flex items-center">{action}</div>}
			</div>

			<Dialog.Root open={openSettings} onOpenChange={setOpenSettings}>
				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 bg-black-900/40 data-[state=open]:animate-overlayShow" />
					<Dialog.Content
						className={clsx(
							"fixed left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2",
							"rounded-[8px] bg-black-850 p-[32px] border-[0.5px] border-black-400 shadow-black-300 focus:outline-none",
						)}
					>
						<Dialog.Title className="m-0 text-[17px] font-medium text-mauve12">
							<VisuallyHidden.Root>Agent settings dialog</VisuallyHidden.Root>
						</Dialog.Title>
						<SettingsPanel />
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>

			<ShareModal
				open={openShareModal}
				onOpenChange={setOpenShareModal}
				appId={data.id}
			/>

			<style jsx global>{`
				@keyframes softFade {
					from { opacity: 0; }
					to { opacity: 1; }
				}

				.animate-softFade {
					animation: softFade 0.5s ease-out;
				}
			`}</style>
		</div>
	);
}

function Divider() {
	return <div className="text-[24px] font-[250]">/</div>;
}

export function RunButton({
	onClick,
}: {
	onClick?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={clsx(
				"flex py-[8px] px-[16px] justify-center items-center gap-[4px]",
				"rounded-[8px]",
				"bg-primary-900 text-[14px] text-white-900",
				"cursor-pointer",
			)}
		>
			<PlayIcon className="size-[16px] fill-white-900" />
			<p>Run</p>
		</button>
	);
}
