"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { AppParameter, Task } from "@giselles-ai/protocol";
import { ChevronDownIcon, ExternalLink } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import Link from "next/link";
import { use, useState } from "react";
import { formatExecutionDate, getStatusBadgeStatus } from "../lib/utils";

export interface TopSectionData {
	task: Task;
	appName: string;
	teamName: string;
	appParameters: AppParameter[];
	iconName: string;
	workspaceId: string;
}

type DynamicIconName = React.ComponentProps<typeof DynamicIcon>["name"];

interface GenerationInputItem {
	name: string;
	value: unknown;
}

export function TopSection({ data }: { data: Promise<TopSectionData> }) {
	const resolvedData = use(data);
	const [isInputsExpanded, setIsInputsExpanded] = useState(false);
	const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

	// Get input values from task (this will need to be fetched from generation)
	// For now, using placeholder logic
	const inputs: GenerationInputItem[] = [];

	return (
		<div className="w-full border-b border-border pb-6">
			{/* Header Row */}
			<div className="flex items-start justify-between mb-6">
				<div className="flex items-start gap-4">
					{/* App Thumbnail */}
					<div className="relative flex h-[120px] w-[120px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all bg-card/60 border-[hsl(192,73%,84%)]">
						<DynamicIcon
							name={resolvedData.iconName as DynamicIconName}
							className="relative z-[1] h-6 w-6 stroke-1 text-[hsl(192,73%,84%)]"
						/>
					</div>

					{/* App Info */}
					<div className="flex flex-col gap-2">
						<h1 className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]">
							{resolvedData.appName} by {resolvedData.teamName}
						</h1>

						{/* Execution Time and Status */}
						<div className="flex items-center gap-2 text-[11px]">
							<span className="text-text-muted">
								{formatExecutionDate(resolvedData.task.createdAt)}
							</span>
							<StatusBadge
								status={getStatusBadgeStatus(resolvedData.task.status)}
								variant="dot"
							>
								{resolvedData.task.status || "Unknown"}
							</StatusBadge>
						</div>

						{/* Input Values Section */}
						{inputs.length > 0 && (
							<div className="mt-2">
								<button
									type="button"
									className="flex items-center justify-between text-[12px] font-medium text-text-muted mb-3 w-full cursor-pointer hover:text-text transition-colors"
									onClick={() => setIsInputsExpanded(!isInputsExpanded)}
								>
									<span>Input parameter</span>
									<ChevronDownIcon
										className={`size-[16px] transition-transform ${
											isInputsExpanded ? "rotate-180" : ""
										}`}
									/>
								</button>
								{isInputsExpanded && (
									<div className="space-y-2">
										{inputs.map((input) => {
											const parameter = resolvedData.appParameters.find(
												(param) => param.id === input.name,
											);

											return (
												<div
													key={`${input.name}-${input.value}`}
													className="bg-white/5 rounded-[8px] p-3"
												>
													<div className="text-[11px] text-text-muted">
														{parameter?.name && (
															<div className="text-text-muted/50 mb-1">
																{parameter.name}
															</div>
														)}
														<div className="text-text-muted/70">
															{String(input.value)}
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Edit in Studio Button */}
				<Link
					href={`/workspaces/${resolvedData.workspaceId}`}
					className="group relative overflow-hidden rounded-lg text-white transition-all duration-300 hover:scale-[1.01] active:scale-95 inline-flex items-center gap-1.5 font-sans text-[14px] font-medium px-4 py-2 whitespace-nowrap"
					style={{
						boxShadow:
							"0 8px 20px rgba(107, 143, 240, 0.2), 0 3px 10px rgba(107, 143, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
						background:
							"linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(107,143,240,0.15) 50%, rgba(107,143,240,0.25) 100%)",
					}}
				>
					<div className="absolute inset-0 rounded-lg blur-[2px] -z-10 bg-[#6B8FF0] opacity-[0.08]" />
					<div
						className="absolute inset-0 rounded-lg backdrop-blur-md"
						style={{
							background:
								"linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(107,143,240,0.1) 50%, rgba(107,143,240,0.2) 100%)",
						}}
					/>
					<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
					<div className="absolute inset-0 rounded-lg border border-white/20" />
					<span className="relative z-10 flex items-center gap-1.5">
						Edit in Studio
						<ExternalLink className="size-4" />
					</span>
					<div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
				</Link>
			</div>

			{/* App Summary Section */}
			<div className="mt-6">
				<button
					type="button"
					className="flex items-center justify-between text-[14px] font-medium text-text mb-3 w-full cursor-pointer hover:text-text transition-colors"
					onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
				>
					<span>App summary:</span>
					<ChevronDownIcon
						className={`size-4 transition-transform ${
							isSummaryExpanded ? "rotate-180" : ""
						}`}
					/>
				</button>
				{isSummaryExpanded && (
					<div className="text-[14px] text-text-muted">
						{/* Placeholder for app summary */}
						<p className="text-text-muted/60">
							App summary will be displayed here.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
