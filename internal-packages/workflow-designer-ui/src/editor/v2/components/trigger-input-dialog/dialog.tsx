import { Button } from "@giselle-internal/ui/button";
import { useToasts } from "@giselle-internal/ui/toast";
import type { ConnectionId, TriggerNode } from "@giselles-ai/protocol";
import { useTaskSystem, useWorkflowDesignerStore } from "@giselles-ai/react";
import { clsx } from "clsx/lite";
import { LoaderIcon, PlayIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { type FormEventHandler, useCallback, useMemo, useState } from "react";
import { useTrigger } from "../../../../hooks/use-trigger";
import {
	buttonLabel,
	createInputsFromTrigger,
	type FormInput,
	parseFormInputs,
} from "./helpers";

export function TriggerInputDialog({
	node,
	connectionIds,
	onClose,
}: {
	node: TriggerNode;
	connectionIds: ConnectionId[];
	onClose: () => void;
}) {
	const { data: trigger, isLoading } = useTrigger(node);

	const inputs = useMemo<FormInput[]>(
		() => createInputsFromTrigger(trigger),
		[trigger],
	);

	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const workspaceId = useWorkflowDesignerStore((s) => s.workspace.id);
	const { createAndStartTask } = useTaskSystem(workspaceId);
	const { toast } = useToasts();

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);
			const { errors, values } = parseFormInputs(inputs, formData);

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				return;
			}

			setValidationErrors({});
			setIsSubmitting(true);

			try {
				const parameterItems = Object.entries(values).map(([name, value]) => {
					if (typeof value === "number") {
						return {
							name,
							type: "number" as const,
							value,
						};
					}
					return {
						name,
						type: "string" as const,
						value: value as string,
					};
				});

				await createAndStartTask({
					connectionIds,
					inputs: [
						{
							type: "parameters",
							items: parameterItems,
						},
					],
					onTaskStart({ cancel, taskId }) {
						toast("Workflow submitted successfully", {
							id: taskId,
							preserve: true,
							action: {
								label: "Cancel",
								onClick: async () => {
									await cancel();
								},
							},
						});
					},
					onTaskComplete: ({ taskId }) => {
						toast.dismiss(taskId);
					},
				});
				onClose();
			} finally {
				setIsSubmitting(false);
			}
		},
		[inputs, onClose, connectionIds, createAndStartTask, toast],
	);

	if (isLoading) {
		return null;
	}

	return (
		<>
			<div className="flex justify-between items-center mb-[14px]">
				<h2 className="font-accent text-[18px] font-bold text-primary-100 drop-shadow-[0_0_10px_#0087F6]">
					{buttonLabel(node)}
				</h2>
				<div className="flex gap-[12px]">
					<Dialog.Close asChild>
						<button
							type="button"
							className="text-inverse hover:text-inverse outline-none"
						>
							<XIcon className="size-[20px]" />
						</button>
					</Dialog.Close>
				</div>
			</div>
			<div className="flex flex-col h-full">
				<form
					className="flex-1 flex flex-col gap-[14px] relative text-inverse overflow-y-hidden"
					onSubmit={handleSubmit}
				>
					<p className="text-[12px] mb-[8px] text-text-muted font-sans font-semibold">
						Execute this flow with custom input values
					</p>

					<div className="flex flex-col gap-[8px]">
						{inputs.map((input) => {
							return (
								<fieldset key={input.name} className={clsx("grid gap-2")}>
									<label
										className="text-[14px] font-medium text-inverse"
										htmlFor={input.name}
									>
										{input.label}
										{input.required && (
											<span className="text-red-500 ml-1">*</span>
										)}
									</label>
									{input.type === "text" && (
										<input
											type="text"
											name={input.name}
											id={input.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[input.name]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
										/>
									)}
									{input.type === "multiline-text" && (
										<textarea
											name={input.name}
											id={input.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[input.name]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
											rows={4}
										/>
									)}
									{input.type === "number" && (
										<input
											type="number"
											name={input.name}
											id={input.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[input.name]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
										/>
									)}
									{validationErrors[input.name] && (
										<span className="text-red-500 text-[12px] font-medium">
											{validationErrors[input.name]}
										</span>
									)}
								</fieldset>
							);
						})}
					</div>
					<div className="flex justify-end">
						<Button
							variant="solid"
							size="large"
							type="submit"
							disabled={isSubmitting}
							leftIcon={
								isSubmitting ? (
									<LoaderIcon className="size-[14px] animate-spin" />
								) : (
									<PlayIcon className="size-[14px] fill-current" />
								)
							}
						>
							{isSubmitting ? "Running..." : "Run"}
						</Button>
					</div>
				</form>
			</div>
		</>
	);
}
