"use client";

import { Select } from "@giselle-internal/ui/select";
import { ArrowUpIcon, Image as ImageIcon } from "lucide-react";

export function InputAreaPlaceholder() {
	return (
		<div className="relative w-full max-w-[640px] min-w-[320px] mx-auto">
			<div className="rounded-2xl bg-[rgba(131,157,195,0.14)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.22)] pt-4 pb-3 sm:pt-5 sm:pb-4 px-4">
				{/* Textarea */}
				<textarea
					placeholder="Ask anything—powered by Giselle docs"
					rows={1}
					disabled
					className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-blue-muted/50 outline-none disabled:cursor-not-allowed min-h-[2.4em] sm:min-h-[2.75em] pt-0 pb-[0.7em] px-1"
					aria-label="Input area placeholder (not yet functional)"
				/>

				{/* Bottom row: App selector and buttons */}
				<div className="flex items-center justify-between mt-2 sm:mt-3">
					{/* Left side: App selector */}
					<div className="flex-1 max-w-[200px]">
						<Select
							options={[]}
							placeholder="Select an app..."
							value={undefined}
							onValueChange={() => {}}
							widthClassName="w-full"
							disabled
							triggerClassName="border-none !bg-[rgba(131,157,195,0.1)] hover:!bg-[rgba(131,157,195,0.18)] !px-2 !h-8 sm:!h-9 !rounded-[7px] sm:!rounded-[9px] text-[13px] [&_svg]:opacity-70"
						/>
					</div>

					{/* Right side: Attachment + Send buttons */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							disabled
							className="flex h-6 w-6 flex-shrink-0 items-center justify-center"
						>
							<ImageIcon className="h-5 w-5 stroke-white/70" />
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
			</div>
			{/* Keyboard shortcut hint (same layout as playground) */}
			<div className="mt-1 flex items-center justify-end gap-[6px] pr-0 text-[11px] text-blue-muted/60">
				<div className="flex items-center gap-[4px]">
					<div className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border border-blue-muted/40 bg-blue-muted/10">
						<span className="text-[10px] leading-none tracking-[0.08em]">
							⌘
						</span>
					</div>
					<div className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] border border-blue-muted/40 bg-blue-muted/10">
						<span className="text-[10px] leading-none tracking-[0.08em]">
							↵
						</span>
					</div>
				</div>
				<span className="leading-none">to send</span>
			</div>
		</div>
	);
}
