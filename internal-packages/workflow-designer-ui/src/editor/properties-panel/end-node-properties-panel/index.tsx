"use client";

import { Button } from "@giselle-internal/ui/button";
import type { EndNode } from "@giselles-ai/protocol";
import { useWorkflowDesigner } from "@giselles-ai/react";
import { ArrowUpIcon, PaperclipIcon, PlusIcon } from "lucide-react";
import {
	NodePanelHeader,
	PropertiesPanelContent,
	PropertiesPanelRoot,
} from "../ui";
import { SettingLabel } from "../ui/setting-label";

export function EndNodePropertiesPanel({ node }: { node: EndNode }) {
	const { deleteNode, updateNodeData } = useWorkflowDesigner();

	return (
		<PropertiesPanelRoot>
			<NodePanelHeader
				node={node}
				onChangeName={(name) => updateNodeData(node, { name })}
				onDelete={() => deleteNode(node.id)}
				readonly
			/>
			<PropertiesPanelContent>
				{/* UI only. Actual binding/behavior will be implemented in a follow-up PR. */}
				<div className="flex flex-col gap-[16px]">
					<div className="space-y-0">
						<SettingLabel className="mb-0">Input Parameter</SettingLabel>
						<div className="px-[4px] py-0 w-full bg-transparent text-[14px] mt-[4px]">
							<ul className="w-full flex flex-col gap-[12px]">
								<li>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-[8px]">
											<span className="text-[14px]">Text</span>
											<span className="text-[12px] text-text-muted">
												multiline-text
											</span>
											<span className="bg-red-900/20 text-red-900 text-[12px] font-medium px-[6px] py-[1px] rounded-full">
												required
											</span>
										</div>
										<Button
											type="button"
											variant="subtle"
											size="default"
											leftIcon={<PlusIcon className="size-[12px]" />}
											disabled
										>
											Select Source
										</Button>
									</div>
								</li>
								<li>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-[8px]">
											<span className="text-[14px]">File</span>
											<span className="text-[12px] text-text-muted">files</span>
										</div>
										<Button
											type="button"
											variant="subtle"
											size="default"
											leftIcon={<PlusIcon className="size-[12px]" />}
											disabled
										>
											Select Source
										</Button>
									</div>
								</li>
							</ul>
						</div>
					</div>

					<div className="text-link-muted text-[12px] block mb-0">
						Stage App Check
					</div>
					<section
						aria-label="Message input and dropzone"
						className="relative rounded-2xl bg-[rgba(131,157,195,0.14)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.22)] pt-4 pb-3 sm:pt-5 sm:pb-4 px-4 transition-colors"
					>
						<div className="relative">
							<textarea
								placeholder=""
								rows={1}
								className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-blue-muted/50 outline-none disabled:cursor-not-allowed h-9 sm:h-10 px-1 py-0 overflow-hidden"
							/>
							<div className="flex items-center justify-between mt-2 sm:mt-3">
								<div className="flex-1" />
								<div className="flex items-center gap-2">
									<button
										type="button"
										className="group flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] transition-colors hover:bg-white/5"
										aria-label="Attach files"
										disabled
									>
										<PaperclipIcon className="h-4 w-4 text-text-muted transition-colors group-hover:text-white" />
									</button>
									<button
										type="button"
										disabled
										className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-[color:var(--color-inverse)] disabled:cursor-not-allowed opacity-40"
									>
										<ArrowUpIcon className="h-3 w-3 text-[color:var(--color-background)]" />
									</button>
								</div>
							</div>
							<input
								className="hidden"
								multiple
								accept="application/pdf,image/*"
								type="file"
							/>
						</div>
					</section>

					<Button
						type="button"
						variant="glass"
						size="large"
						className="w-full"
						disabled
					>
						Try App in Stage
					</Button>
				</div>
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
