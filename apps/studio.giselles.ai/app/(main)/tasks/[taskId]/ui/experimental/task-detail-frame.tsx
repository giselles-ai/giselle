"use client";

import clsx from "clsx/lite";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GenerationView } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { OutputActions } from "../output-actions";
import { useOutputDetailPaneStore } from "./output-detail-pane-store";

function useIsDesktop() {
	return useSyncExternalStore(
		(onStoreChange) => {
			const mediaQueryList = window.matchMedia("(min-width: 768px)");
			mediaQueryList.addEventListener("change", onStoreChange);
			return () => mediaQueryList.removeEventListener("change", onStoreChange);
		},
		() => window.matchMedia("(min-width: 768px)").matches,
		() => false,
	);
}

export function TaskDetailFrame({ children }: React.PropsWithChildren) {
	const pathname = usePathname();
	const opened = useOutputDetailPaneStore((s) => s.opened);
	const close = useOutputDetailPaneStore((s) => s.close);
	const isDesktop = useIsDesktop();
	const rightPanelRef = useRef<ImperativePanelHandle | null>(null);
	const isPaneOpen = opened != null;

	// The store can survive client-side navigation / HMR.
	// Ensure the detail pane is closed on page enter (and when navigating between tasks).
	// biome-ignore lint/correctness/useExhaustiveDependencies: we intentionally reset when the route changes.
	useEffect(() => {
		close();
	}, [close, pathname]);

	// Keep the DOM/layout stable to avoid flicker.
	// We animate the panel size (via flex-grow transition) and fade the content in/out.
	useEffect(() => {
		const panel = rightPanelRef.current as unknown as {
			collapse?: () => void;
			expand?: () => void;
		} | null;
		if (!panel) return;
		if (isPaneOpen) {
			panel.expand?.();
		} else {
			panel.collapse?.();
		}
	}, [isPaneOpen]);

	return (
		<div className="bg-bg text-foreground h-full font-sans overflow-y-hidden">
			{isDesktop ? (
				<div className="h-full">
					<PanelGroup
						direction="horizontal"
						className="h-full"
						autoSaveId="task-detail-split"
					>
						<Panel
							defaultSize={50}
							minSize={30}
							className="transition-[flex-grow] duration-200 ease-out"
						>
							<div className="h-full flex justify-center">
								<div className="max-w-[640px] w-full flex flex-col h-full px-2">
									{children}
								</div>
							</div>
						</Panel>

						{isPaneOpen ? (
							<PanelResizeHandle
								className={clsx(
									"w-[3px] cursor-col-resize group flex items-center justify-center",
								)}
							>
								<div
									className={clsx(
										"w-full h-[32px] translate-x-[2px] rounded-full transition-colors",
										"bg-[#6b7280] opacity-60",
										"group-data-[resize-handle-state=hover]:bg-[#4a90e2]",
										"group-data-[resize-handle-state=drag]:bg-[#4a90e2]",
									)}
								/>
							</PanelResizeHandle>
						) : null}

						<Panel
							// Keep panel mounted but collapsed when closed (no reserved space).
							collapsible
							collapsedSize={0}
							defaultSize={50}
							minSize={20}
							ref={rightPanelRef}
							className="transition-[flex-grow] duration-200 ease-out"
						>
							<div className="h-full">
								<AnimatePresence initial={false}>
									{opened ? (
										<motion.div
											key={opened.id}
											className="h-full overflow-hidden bg-white/5 border border-white/5 min-w-0 flex flex-col px-4 py-3"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.12, ease: "easeOut" }}
										>
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
														<XIcon
															className="size-4 text-text-muted"
															aria-hidden
														/>
													</button>
												</div>
											</div>
											<div className="flex-1 min-h-0 overflow-y-auto [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
												<GenerationView generation={opened.generation} />
											</div>
										</motion.div>
									) : null}
								</AnimatePresence>
							</div>
						</Panel>
					</PanelGroup>
				</div>
			) : (
				<div className="mx-auto w-full h-full flex flex-col gap-4">
					<div className="max-w-[640px] w-full mx-auto flex flex-col h-full px-2">
						{children}
						<AnimatePresence>
							{opened ? (
								<motion.div
									key="task-output-detail-mobile"
									className="mt-4 overflow-hidden bg-white/5 border border-white/5 min-w-0 flex flex-col px-2 py-3"
									initial={{ opacity: 0, y: 6 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 6 }}
									transition={{ duration: 0.18, ease: "easeOut" }}
								>
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
								</motion.div>
							) : null}
						</AnimatePresence>
					</div>
				</div>
			)}
		</div>
	);
}
