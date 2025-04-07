import type {
	OverrideNode,
	Workflow,
	WorkflowId,
} from "@giselle-sdk/data-type";
import { PencilIcon, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useCallback } from "react";
import { Button } from "../ui/button";
import { RunWithOverrideParamsForm } from "./run-with-override-params-form";

// Global variable to store override nodes
const currentOverrideNodes: OverrideNode[] = [];

export function DialogWithOverrideForm({
	flow,
	perform,
}: {
	flow: Workflow;
	perform: (
		flowId: WorkflowId,
		options?: { overrideNodes?: OverrideNode[] },
	) => void;
}) {
	// Handle Run with override button click
	const handleRunWithOverride = useCallback(() => {
		perform(flow.id, {
			overrideNodes: currentOverrideNodes,
		});
	}, [flow.id, perform]);

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<button type="button" className="hover:bg-black-800/20 rounded-[4px]">
					<PencilIcon className="size-[18px]" />
				</button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/25 z-50" />
				<Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[900px] h-[600px] bg-black-900 rounded-[12px] p-[24px] shadow-xl z-50 overflow-hidden border border-black-400">
					<Dialog.Title className="sr-only">
						Override inputs to test workflow
					</Dialog.Title>
					<div className="flex justify-between items-center mb-[24px]">
						<h2 className="font-accent text-[18px] font-bold text-primary-100 drop-shadow-[0_0_10px_#0087F6]">
							Override inputs to test workflow
						</h2>
						<div className="flex gap-[12px]">
							<Dialog.Close asChild>
								<button
									type="button"
									className="text-white-400 hover:text-white-900"
								>
									<X className="size-[20px]" />
								</button>
							</Dialog.Close>
							<Button
								type="button"
								className="bg-primary-900 hover:bg-primary-800"
								onClick={handleRunWithOverride}
							>
								Run with override
							</Button>
						</div>
					</div>
					{flow && <RunWithOverrideParamsForm flow={flow} />}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
