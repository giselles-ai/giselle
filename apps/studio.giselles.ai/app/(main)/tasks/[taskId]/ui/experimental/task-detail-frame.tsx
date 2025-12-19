"use client";

import clsx from "clsx/lite";
import { XIcon } from "lucide-react";
import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GenerationView } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { OutputActions } from "../output-actions";
import { useOutputDetailPaneStore } from "./output-detail-pane-store";

export function TaskDetailFrame({ children }: React.PropsWithChildren) {
	const opened = useOutputDetailPaneStore((s) => s.opened);
	const close = useOutputDetailPaneStore((s) => s.close);

	// Ensure the right pane is closed when entering the task page.
	// The store can survive client-side navigation / HMR, so we must reset it on mount.
	useEffect(() => {
		close();
	}, [close]);

	return (
		<div className="bg-bg text-foreground h-full font-sans overflow-y-hidden">
			{/* Mobile: keep simple single column */}
			<div className="md:hidden mx-auto w-full h-full flex flex-col gap-4">
				<div className="max-w-[640px] w-full mx-auto flex flex-col h-full px-2">
					{children}
					{opened ? (
						<div className="mt-4 overflow-hidden rounded-xl bg-blue-muted/5 min-w-0 flex flex-col px-2 py-3">
							<div className="flex items-center justify-between mb-2 w-full gap-3">
								<h3 className="text-[16px] font-medium text-inverse truncate">
									{opened.title}
								</h3>
								<div className="flex items-center gap-2">
									<OutputActions generation={opened.generation} />
									<button
										type="button"
										onClick={close}
										className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
										aria-label="Close output"
									>
										<XIcon className="size-4 text-text-muted" aria-hidden />
									</button>
								</div>
							</div>
							<div className="max-h-[50vh] overflow-y-auto [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
								<GenerationView generation={opened.generation} />
							</div>
						</div>
					) : null}
				</div>
			</div>

			{/* Desktop: split ONLY when opened; otherwise keep centered single column */}
			<div className="hidden md:block h-full">
				{opened ? (
					<PanelGroup
						direction="horizontal"
						className="h-full px-2"
						autoSaveId="task-detail-split"
					>
						<Panel defaultSize={50} minSize={30}>
							<div className="h-full flex justify-center">
								<div className="max-w-[640px] w-full flex flex-col h-full px-2">
									{children}
								</div>
							</div>
						</Panel>
						<PanelResizeHandle
							className={clsx(
								"w-[3px] cursor-col-resize group flex items-center justify-center",
							)}
						>
							<div
								className={clsx(
									"w-full h-[32px] rounded-full transition-colors",
									"bg-[#6b7280] opacity-60",
									"group-data-[resize-handle-state=hover]:bg-[#4a90e2]",
									"group-data-[resize-handle-state=drag]:bg-[#4a90e2]",
								)}
							/>
						</PanelResizeHandle>
						<Panel defaultSize={50} minSize={20}>
							<div className="h-full">
								<div className="h-full overflow-hidden rounded-xl bg-blue-muted/5 min-w-0 flex flex-col px-3 py-3">
									<div className="flex items-center justify-between mb-2 w-full gap-3">
										<h3 className="text-[16px] font-medium text-inverse truncate">
											{opened.title}
										</h3>
										<div className="flex items-center gap-2">
											<OutputActions generation={opened.generation} />
											<button
												type="button"
												onClick={close}
												className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors"
												aria-label="Close output"
											>
												<XIcon className="size-4 text-text-muted" aria-hidden />
											</button>
										</div>
									</div>
									<div className="flex-1 min-h-0 overflow-y-auto [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
										<GenerationView generation={opened.generation} />
									</div>
								</div>
							</div>
						</Panel>
					</PanelGroup>
				) : (
					<div className="h-full flex justify-center">
						<div className="max-w-[640px] w-full flex flex-col h-full px-2">
							{children}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
