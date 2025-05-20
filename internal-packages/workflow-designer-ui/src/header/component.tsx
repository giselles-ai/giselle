"use client";
import {
	type Generation,
	type TriggerNode,
	type WorkspaceId,
	isTriggerNode,
} from "@giselle-sdk/data-type";
import type { TriggerProvider } from "@giselle-sdk/flow";
import { useGenerationRunnerSystem } from "@giselle-sdk/giselle-engine/react";
import { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import clsx from "clsx/lite";
import {
	ViewState,
	useFeatureFlag,
	useWorkflowDesigner,
} from "giselle-sdk/react";
import { ChevronDownIcon, PlayIcon, XIcon } from "lucide-react";
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
import { useTrigger } from "../hooks/use-trigger";
import { GiselleLogo } from "../icons";
import { SettingsPanel } from "../settings";
import { ShareButton } from "../ui/button";
import { ReadOnlyBadge } from "../ui/read-only-banner";
import { ShareModal } from "../ui/share-modal";
import { UserPresence } from "../ui/user-presence";
import { triggerNodeDefaultName } from "../utils";
import { Button, TriggerInputDialog, buttonLabel } from "./ui";

function Trigger() {
	const { data } = useWorkflowDesigner();
	const [selectedTriggerNode, setSelectedTriggerNode] =
		useState<TriggerNode | null>(null);

	const triggerNodes = useMemo(() => {
		const tmp: TriggerNode[] = [];
		for (const node of data.nodes) {
			if (!isTriggerNode(node)) {
				continue;
			}
			if (node.content.state.status === "unconfigured") {
				continue;
			}
			tmp.push(node);
		}
		return tmp;
	}, [data.nodes]);

	const handleTriggerSelect = useCallback((node: TriggerNode) => {
		setSelectedTriggerNode(node);
	}, []);

	if (triggerNodes.length === 0) {
		return null;
	}

	// Use a unified button and dialog approach for both single and multiple triggers
	return (
		<Dialog.Root onOpenChange={(open) => !open && setSelectedTriggerNode(null)}>
			<Dialog.Trigger asChild>
				<Button
					leftIcon={<PlayIcon className="size-[14px] fill-black-900" />}
					type="button"
				>
					{triggerNodes.length === 1 ? buttonLabel(triggerNodes[0]) : "Run"}
				</Button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/25 z-50" />
				<Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[400px] bg-black-900 rounded-[12px] p-[24px] shadow-xl z-50 overflow-hidden border border-black-400 outline-none">
					<Dialog.Title className="sr-only">
						Override inputs to test workflow
					</Dialog.Title>

					{triggerNodes.length === 1 ? (
						<TriggerInputDialog node={triggerNodes[0]} />
					) : (
						<>
							{selectedTriggerNode ? (
								<TriggerInputDialog node={selectedTriggerNode} />
							) : (
								// Show trigger selection
								<div className="space-y-4">
									<h3 className="text-white-900 text-[16px] font-medium mb-2">
										Select a trigger to execute
									</h3>
									<div className="space-y-2">
										{triggerNodes.map((triggerNode) => (
											<button
												type="button"
												key={triggerNode.id}
												className="w-full text-left text-white-900 p-3 border border-black-400 rounded-[6px] hover:bg-black-800 flex items-center gap-2"
												onClick={() => handleTriggerSelect(triggerNode)}
											>
												<PlayIcon className="size-[14px] shrink-0 fill-white-900" />
												<div className="flex flex-col">
													<span className="font-medium">
														{triggerNode.name ??
															triggerNodeDefaultName(
																triggerNode.content.provider,
															)}{" "}
														<span className="text-[10px] text-white-300 font-mono">
															(id:{triggerNode.id.substring(3, 11)})
														</span>
													</span>
													<span className="text-white-700 text-xs">
														{buttonLabel(triggerNode)}
													</span>
												</div>
											</button>
										))}
									</div>
								</div>
							)}
						</>
					)}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
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
