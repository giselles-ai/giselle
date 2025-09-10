"use client";

import type { FlowTrigger } from "@giselle-sdk/data-type";
import { X } from "lucide-react";
import {
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../../../../(main)/settings/components/button";
import { AppIcon } from "../../../(top)/app-icon";
import { FormInputRenderer } from "../../../(top)/form-input-renderer";
import {
	createInputsFromTrigger,
	parseFormInputs,
	toParameterItems,
} from "../../../(top)/helpers";
import { fetchWorkspaceFlowTrigger, runWorkspaceApp } from "../actions";

interface RunModalProps {
	isOpen: boolean;
	onClose: () => void;
	appName: string;
	workspaceId?: string | null;
	teamId: string;
}

export function RunModal({
	isOpen,
	onClose,
	appName,
	workspaceId,
	teamId,
}: RunModalProps) {
	const [flowTriggerData, setFlowTriggerData] = useState<{
		flowTrigger: FlowTrigger;
		workspaceName: string;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	// Load flow trigger data when modal opens
	useEffect(() => {
		if (isOpen && workspaceId) {
			setIsLoading(true);
			fetchWorkspaceFlowTrigger(workspaceId)
				.then(setFlowTriggerData)
				.finally(() => setIsLoading(false));
		} else {
			setFlowTriggerData(null);
		}
	}, [isOpen, workspaceId]);

	const inputs = useMemo(
		() => createInputsFromTrigger(flowTriggerData?.flowTrigger),
		[flowTriggerData],
	);

	const formAction = useCallback(
		async (_prevState: unknown, formData: FormData) => {
			if (!flowTriggerData) return null;

			const { errors, values } = parseFormInputs(inputs, formData);

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				return null;
			}

			setValidationErrors({});

			try {
				await runWorkspaceApp(
					teamId,
					flowTriggerData.flowTrigger,
					toParameterItems(inputs, values),
				);
				onClose();
			} catch (error) {
				console.error("Failed to run app:", error);
			}
			return null;
		},
		[inputs, flowTriggerData, teamId, onClose],
	);

	const [, action, isPending] = useActionState(formAction, null);

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				role="button"
				tabIndex={0}
				aria-label="Close modal"
			/>

			{/* Slide-up Modal */}
			<div className="fixed inset-x-0 bottom-0 md:absolute md:left-0 md:right-0 z-50 animate-in slide-in-from-bottom-full duration-300">
				<div className="relative z-10 rounded-t-2xl shadow-xl focus:outline-none">
					<div
						className="absolute inset-0 -z-10 backdrop-blur-md rounded-t-2xl"
						style={{
							background:
								"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
						}}
					/>
					<div className="absolute -z-10 top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
					<div className="absolute -z-10 inset-0 border border-white/10 rounded-t-2xl" />

					{/* Header */}
					<div className="flex items-center justify-between mb-4 px-6 pt-6">
						<div className="flex items-center gap-3">
							{/* App Thumbnail */}
							<div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
								<AppIcon className="h-6 w-6 text-white/40" />
							</div>
							{/* App Title */}
							<div className="flex flex-col">
								<h3 className="font-sans text-[16px] font-medium tracking-tight text-white-100">
									{appName}
								</h3>
								<p className="text-[12px] text-white-400 font-geist">
									Configure and run
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="rounded-full p-2 text-white-400 opacity-70 hover:opacity-100 hover:bg-white/10 focus:outline-none transition-all"
						>
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</button>
					</div>

					{/* Content */}
					<div className="px-6 pb-8">
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60"></div>
								<span className="ml-3 text-white/60">Loading...</span>
							</div>
						) : !flowTriggerData ? (
							<div className="text-center py-8">
								<p className="text-white/60 text-[14px]">
									No runnable trigger found in this app
								</p>
							</div>
						) : (
							<form action={action} className="text-[14px]">
								<FormInputRenderer
									inputs={inputs}
									validationErrors={validationErrors}
									isPending={isPending}
								/>
								<div className="mt-6 flex justify-end gap-x-3 pb-6">
									<button
										type="button"
										onClick={onClose}
										disabled={isPending}
										className={cn(buttonVariants({ variant: "link" }))}
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isPending}
										className={cn(
											buttonVariants({ variant: "primary" }),
											"whitespace-nowrap",
										)}
									>
										{isPending ? "Setting the stage…" : "Start"}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
