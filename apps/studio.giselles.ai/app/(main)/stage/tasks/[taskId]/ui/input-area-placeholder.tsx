"use client";

import { Select } from "@giselle-internal/ui/select";
import { ArrowUpIcon, Image as ImageIcon } from "lucide-react";

export function InputAreaPlaceholder() {
	return (
		<div className="relative w-full max-w-[960px] min-w-[320px] mx-auto">
			<div className="border border-white rounded-[14px] pt-4 px-4 pb-2">
				{/* Textarea */}
				<textarea
					placeholder="Ask anything—powered by Giselle docs"
					rows={1}
					disabled
					className="w-full resize-none bg-transparent text-[15px] text-foreground placeholder:text-foreground/40 outline-none"
					aria-label="Input area placeholder (not yet functional)"
				/>

				{/* Bottom row: App selector and buttons */}
				<div className="flex items-center justify-between mt-3">
					{/* Left side: App selector */}
					<div className="flex-1 max-w-[200px]">
						<Select
							options={[]}
							placeholder="Select an app..."
							value={undefined}
							onValueChange={() => {}}
							widthClassName="w-full"
							disabled
						/>
					</div>

					{/* Right side: Attachment + Send buttons */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							disabled
							className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] border border-white"
						>
							<ImageIcon className="h-3 w-3 stroke-white" />
						</button>
						<button
							type="button"
							disabled
							className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] border border-white"
						>
							<ArrowUpIcon className="h-3 w-3 stroke-white" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
