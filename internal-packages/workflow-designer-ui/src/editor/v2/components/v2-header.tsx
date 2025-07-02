"use client";

import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import {
	useFeatureFlag,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import clsx from "clsx/lite";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { GiselleIcon } from "../../../icons";
import { EditableText, type EditableTextRef } from "../../properties-panel/ui";
import { RunButton } from "./run-button";

export function V2Header({
	teamName,
	onNameChange,
}: {
	teamName?: string;
	onNameChange?: (name: string) => Promise<void>;
}) {
	const { data, updateName } = useWorkflowDesigner();
	const editableTextRef = useRef<EditableTextRef>(null);
	const { layoutV3 } = useFeatureFlag();

	const handleUpdateName = async (value?: string) => {
		if (!value) return;
		updateName(value);
		await onNameChange?.(value);
	};

	return (
		<div
			className={clsx(
				"relative h-[48px] flex items-center justify-between",
				"pl-[8px] pr-[8px] gap-[8px]",
				"border-b border-white/10",
				"shrink-0",
			)}
		>
			{/* Left section: Logo + Team/App names */}
			<div className="flex items-center gap-[3px] min-w-0">
				<Link
					href="/"
					className="flex items-center gap-[3px] group"
					aria-label="Go to home"
				>
					<GiselleIcon className="text-white-900 w-[24px] h-[24px] group-hover:text-primary-100 transition-colors" />
					<span className="text-white-900 text-[13px] font-semibold group-hover:text-primary-100 transition-colors">
						Studio
					</span>
				</Link>
				<span className="text-white-900/20 text-[18px] font-[250] leading-none ml-[4px]">
					/
				</span>

				{/* Team / App names */}
				<div className="flex items-center gap-[3px] min-w-0 ml-[6px]">
					{teamName && (
						<span className="text-[#6B8FF0] text-[13px] truncate max-w-[160px]">
							{teamName}
						</span>
					)}
					{teamName && (
						<span className="text-white-600 text-[18px] font-[250] leading-none">
							/
						</span>
					)}
					{/* app name editable */}
					<div className="max-w-[200px]">
						<EditableText
							ref={editableTextRef}
							fallbackValue="Untitled"
							onChange={handleUpdateName}
							value={data.name}
							className="text-[#6B8FF0] text-[13px] font-medium"
						/>
					</div>
					{/* dropdown menu */}
					{layoutV3 && (
						<DropdownMenu
							items={[
								{
									id: "rename",
									name: "Rename",
									action: () => editableTextRef.current?.triggerEdit(),
								},
								{
									id: "duplicate",
									name: "Duplicate",
									action: () => {
										// TODO: Implement app duplication functionality
										console.warn("Duplicate functionality not yet implemented");
									},
								},
								{ id: "template", name: "Create a Template", disabled: true },
								{
									id: "delete",
									name: "Delete",
									action: () => {
										// TODO: Implement app deletion functionality
										console.warn("Delete functionality not yet implemented");
									},
									destructive: true,
								},
							]}
							trigger={
								<button
									type="button"
									className="ml-[4px] p-0 border-none bg-transparent w-auto h-auto hover:bg-transparent focus:bg-transparent outline-none"
								>
									<ChevronDownIcon className="size-[16px] text-[#6B8FF0] hover:text-white-950" />
								</button>
							}
							renderItem={(item) =>
								item.id === "template" ? (
									<div className="flex items-center justify-between w-full opacity-50">
										<span>{item.name}</span>
										<span className="ml-2 text-[10px] leading-none text-white-600 bg-white/30 px-1.5 py-[1px] rounded-full">
											Coming&nbsp;soon
										</span>
									</div>
								) : (
									<span className={item.destructive ? "text-error-900" : ""}>
										{item.name}
									</span>
								)
							}
							onSelect={(_event, item) => {
								if (!item.disabled && item.action) {
									item.action();
								}
							}}
							sideOffset={12}
							align="start"
						/>
					)}
				</div>
			</div>

			{/* Right section: Run button */}
			<RunButton />
		</div>
	);
}
