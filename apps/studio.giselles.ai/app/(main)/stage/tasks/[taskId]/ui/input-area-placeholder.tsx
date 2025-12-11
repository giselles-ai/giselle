"use client";

import { ArrowUpIcon } from "lucide-react";

export function InputAreaPlaceholder() {
	return (
		<div className="relative w-full max-w-[640px] min-w-[320px] mx-auto">
			<div className="rounded-xl bg-[rgba(131,157,195,0.14)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.22)] pt-3 pb-2 px-4">
				{/* Textarea and Send button in one row */}
				<div className="flex items-center gap-2">
					<textarea
						placeholder="Ask anything—powered by Giselle docs"
						rows={1}
						disabled
						className="flex-1 resize-none bg-transparent text-[14px] text-foreground placeholder:text-blue-muted/50 outline-none disabled:cursor-not-allowed min-h-[1.75em] pt-0 pb-[0.4em] px-1"
						aria-label="Input area placeholder (not yet functional)"
					/>
					<button
						type="button"
						disabled
						className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-inverse)] disabled:cursor-not-allowed opacity-40"
					>
						<ArrowUpIcon className="h-2.5 w-2.5 text-[color:var(--color-background)]" />
					</button>
				</div>
			</div>
		</div>
	);
}
