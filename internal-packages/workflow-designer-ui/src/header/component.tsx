"use client";

import type { WorkspaceId } from "@giselle-sdk/data-type";
import clsx from "clsx";
import { ViewState, useWorkflowDesigner } from "giselle-sdk/react";
import { CableIcon, EyeIcon, GanttChartIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { Dialog, ToggleGroup, VisuallyHidden } from "radix-ui";
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

					{/*
					Setting menu is moved to main view
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
					</DropdownMenu.Root> */}
				</div>
			</div>

			<div className="flex items-center gap-[12px]">
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
