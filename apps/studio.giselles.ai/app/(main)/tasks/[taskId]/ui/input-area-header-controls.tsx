"use client";

import { Select } from "@giselle-internal/ui/select";
import type { Task } from "@giselles-ai/protocol";
import { Paperclip } from "lucide-react";
import { use } from "react";

export function InputAreaHeaderControls({
	taskPromise,
}: {
	taskPromise: Promise<Task>;
}) {
	const task = use(taskPromise);
	const appLabel = task.name ?? "Selected app";

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				disabled
				className="flex h-5 w-5 flex-shrink-0 items-center justify-center"
			>
				<Paperclip className="h-3.5 w-3.5 text-text-muted/70" />
			</button>
			<div className="w-[200px]">
				<Select
					options={[{ value: task.id, label: appLabel }]}
					placeholder={appLabel}
					value={task.id}
					onValueChange={() => {}}
					widthClassName="w-full"
					disabled
					side="top"
					triggerClassName="border border-border !bg-[rgba(131,157,195,0.1)] hover:!bg-[rgba(131,157,195,0.18)] !px-2 !h-7 !rounded-[6px] text-[12px] [&_svg]:opacity-70"
				/>
			</div>
		</div>
	);
}
