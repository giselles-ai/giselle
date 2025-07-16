"use client";
import {
	isTriggerNode,
	type TriggerNode,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import {
	triggerNodeDefaultName,
	useFeatureFlag,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import { PlayIcon } from "lucide-react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { EditableText } from "../editor/properties-panel/ui";
import { GiselleLogo } from "../icons";
import { ShareButton } from "../ui/button";
import { ReadOnlyBadge } from "../ui/read-only-banner";
import { ShareModal } from "../ui/share-modal";
import { ToastProvider } from "../ui/toast";
import { UserPresence } from "../ui/user-presence";
import { RunButton } from "./run-button";
import { Button } from "./run-button/ui/button";
import { buttonLabel, TriggerInputDialog } from "./ui";

function Trigger() {
	const { data } = useWorkflowDesigner();
	const [selectedTriggerNode, setSelectedTriggerNode] =
		useState<TriggerNode | null>(null);
	const [open, setOpen] = useState(false);

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

	const handleClose = useCallback(() => {
		setOpen(false);
		setSelectedTriggerNode(null);
	}, []);

	if (triggerNodes.length === 0) {
		return null;
	}

	// Use a unified button and dialog approach for both single and multiple triggers
	return (
		<Dialog.Root
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) {
					setSelectedTriggerNode(null);
				}
			}}
		>
			<Dialog.Trigger asChild>
				<Button
					leftIcon={<PlayIcon className="size-[14px] fill-black-900" />}
					type="button"
				>
					{triggerNodes.length === 1 ? buttonLabel(triggerNodes[0]) : "Run"}
				</Button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<Dialog.Content className="relative z-10 w-[90vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[12px] p-6 shadow-xl focus:outline-none">
						<div
							className="absolute inset-0 -z-10 rounded-[12px] backdrop-blur-md"
							style={{
								background:
									"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
							}}
						/>
						<div className="absolute -z-10 top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
						<div className="absolute -z-10 inset-0 rounded-[12px] border border-white/10" />
						<Dialog.Title className="sr-only">
							Override inputs to test workflow
						</Dialog.Title>

						{triggerNodes.length === 1 ? (
							<TriggerInputDialog
								node={triggerNodes[0]}
								onClose={handleClose}
							/>
						) : selectedTriggerNode ? (
							<TriggerInputDialog
								node={selectedTriggerNode}
								onClose={handleClose}
							/>
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
					</Dialog.Content>
				</div>
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
	const { data, updateName } = useWorkflowDesigner();
	const [_openSettings, _setOpenSettings] = useState(false);
	const [openShareModal, setOpenShareModal] = useState(false);
	const { runV3 } = useFeatureFlag();

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
		<ToastProvider>
			<div className="h-[54px] pl-[24px] pr-[16px] flex items-center justify-between shrink-0">
				<div className="flex items-center gap-[8px] text-white-950">
					<Link href="/" aria-label="Giselle logo">
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
								ariaLabel="App name"
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
					{runV3 ? (
						<RunButton />
					) : (
						<>
							<Trigger />
							{shareFeatureFlag && (
								<>
									<UserPresence />
									<ShareButton onClick={() => setOpenShareModal(true)} />
								</>
							)}
							{action && <div className="flex items-center">{action}</div>}
						</>
					)}
				</div>

				<ShareModal open={openShareModal} onOpenChange={setOpenShareModal} />

				<style jsx global>{`
          @keyframes softFade {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .animate-softFade {
            animation: softFade 0.5s ease-out;
          }
        `}</style>
			</div>
		</ToastProvider>
	);
}

function Divider() {
	return <div className="text-[24px] font-[250]">/</div>;
}

// export function RunButton({
// 	onClick,
// }: {
// 	onClick?: () => void;
// }) {
// 	return (
// 		<button
// 			type="button"
// 			onClick={onClick}
// 			className={clsx(
// 				"flex py-[8px] px-[16px] justify-center items-center gap-[4px]",
// 				"rounded-[8px]",
// 				"bg-primary-900 text-[14px] text-white-900",
// 				"cursor-pointer",
// 			)}
// 		>
// 			<PlayIcon className="size-[16px] fill-white-900" />
// 			<p>Run</p>
// 		</button>
// 	);
// }
