"use client";

import type { WorkspaceId } from "@giselle-sdk/data-type";
import clsx from "clsx";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { ViewState } from "giselle-sdk/react";
import {
	ChevronDownIcon,
	EyeIcon,
	GanttChartIcon,
	PlayIcon,
} from "lucide-react";
import Link from "next/link";
import { Dialog, DropdownMenu, VisuallyHidden } from "radix-ui";
import { type ReactNode, useState } from "react";
import { EditableText } from "../editor/properties-panel/ui";
import { GiselleLogo } from "../icons";
import { SettingsPanel } from "../settings";

export function Header({
	action,
	onWorkflowNameChange,
}: {
	action?: ReactNode;
	onWorkflowNameChange?: (workspaceId: WorkspaceId, name: string) => void;
}) {
	const { data, updateName, view, setView } = useWorkflowDesigner();
	const [openSettings, setOpenSettings] = useState(false);

	const toggleView = () => {
		setView(view === "editor" ? "viewer" : "editor");
	};

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
					<EditableText
						fallbackValue="Untitled"
						onChange={updateWorkflowName}
						value={data.name}
					/>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild>
							<button
								type="button"
								className="group-hover:bg-white-900/10 hover:bg-white-900/20 rounded-r-[4px] peer-data-[editing=true]:hidden px-[2px]"
							>
								<ChevronDownIcon className="size-[12px] text-white-900" />
							</button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content
								align="start"
								className={clsx(
									"relative rounded py-[8px] min-w-[200px]",
									"rounded-[8px] border-[1px] bg-black-900/50 backdrop-blur-[8px]",
									"shadow-[-2px_-1px_0px_0px_rgba(0,0,0,0.1),1px_1px_8px_0px_rgba(0,0,0,0.25)]",
								)}
								onCloseAutoFocus={(e) => {
									e.preventDefault();
								}}
							>
								<div
									className={clsx(
										"absolute z-0 rounded-[8px] inset-0 border-[1px] mask-fill bg-gradient-to-br bg-origin-border bg-clip-boarder border-transparent",
										"from-[hsl(232,_36%,_72%)]/40 to-[hsl(218,_58%,_21%)]/90",
									)}
								/>
								<div className="relative flex flex-col gap-[8px]">
									<DropdownMenu.RadioGroup
										className="flex flex-col gap-[8px] px-[8px]"
										onValueChange={(value) => {
											if (value === "settings") {
												setOpenSettings(true);
											}
										}}
									>
										<DropdownMenu.RadioItem
											className="p-[8px] rounded-[8px] text-white-900 hover:bg-primary-900/50 transition-colors cursor-pointer text-[12px] outline-none select-none"
											value="settings"
										>
											Settings
										</DropdownMenu.RadioItem>
									</DropdownMenu.RadioGroup>
								</div>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>
			</div>

			<div className="flex items-center gap-[12px]">
				<div className="flex items-center overflow-hidden rounded-[8px] border border-black-400/30">
					<button
						type="button"
						onClick={toggleView}
						className={clsx(
							"flex items-center gap-[4px] px-[12px] py-[6px] text-[14px] transition-colors",
							view === "editor"
								? "bg-primary-900 text-white-900"
								: "bg-transparent text-white-900/70 hover:text-white-900 hover:bg-black-800",
						)}
					>
						<GanttChartIcon className="size-[16px]" />
						<span>Builder</span>
					</button>
					<button
						type="button"
						onClick={toggleView}
						className={clsx(
							"flex items-center gap-[4px] px-[12px] py-[6px] text-[14px] transition-colors",
							view === "viewer"
								? "bg-primary-900 text-white-900"
								: "bg-transparent text-white-900/70 hover:text-white-900 hover:bg-black-800",
						)}
					>
						<EyeIcon className="size-[16px]" />
						<span>Preview</span>
					</button>
				</div>

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
