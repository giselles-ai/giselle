import { Button } from "@giselle-internal/ui/button";
import { useToasts } from "@giselle-internal/ui/toast";
import type { AppEntryNode } from "@giselles-ai/protocol";
import {
	useGiselle,
	useTaskSystem,
	useWorkflowDesignerStore,
} from "@giselles-ai/react";
import { clsx } from "clsx/lite";
import { LoaderIcon, PlayIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { type FormEventHandler, useCallback, useState } from "react";
import useSWR from "swr";

export function AppEntryInputDialog({
	node,
	onClose,
}: {
	node: AppEntryNode;
	onClose: () => void;
}) {
	const client = useGiselle();
	const { isLoading, data } = useSWR(
		node.content.status === "unconfigured"
			? null
			: {
					namespace: "getApp",
					appId: node.content.appId,
				},
		({ appId }) => client.getApp({ appId }).then((res) => res.app),
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

			if (data === undefined) {
				return;
			}

			const formData = new FormData(e.currentTarget);
			const errors: Record<string, string> = {};
			const values: Record<string, string | number> = {};

			for (const parameter of data.parameters) {
				const formDataEntryValue = formData.get(parameter.name);
				const value = formDataEntryValue
					? formDataEntryValue.toString().trim()
					: "";

				if (parameter.required && value === "") {
					errors[parameter.id] = `${parameter.name} is required`;
					continue;
				}

				if (value === "") {
					values[parameter.id] = "";
					continue;
				}

				switch (parameter.type) {
					case "text":
					case "multiline-text":
						values[parameter.id] = value;
						break;
					case "number": {
						const numValue = Number(value);
						if (Number.isNaN(numValue)) {
							errors[parameter.id] = `${parameter.name} must be a valid number`;
						} else {
							values[parameter.id] = numValue;
						}
						break;
					}
					default: {
						const _exhaustiveCheck: never = parameter.type;
						throw new Error(`Unhandled input type: ${_exhaustiveCheck}`);
					}
				}
			}

			if (Object.keys(errors).length > 0) {
				setValidationErrors(errors);
				return;
			}

			setValidationErrors({});
			setIsSubmitting(true);

			try {
				const parameterItems = Object.entries(values).map(([id, value]) => {
					if (typeof value === "number") {
						return {
							name: id,
							type: "number" as const,
							value,
						};
					}
					return {
						name: id,
						type: "string" as const,
						value: value as string,
					};
				});

				await createAndStartTask({
					nodeId: node.id,
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
		[data, onClose, node, createAndStartTask, toast],
	);

	if (isLoading || data === undefined) {
		return null;
	}

	return (
		<>
			<div className="flex justify-between items-center mb-[14px]">
				<h2 className="font-accent text-[18px] font-bold text-primary-100 drop-shadow-[0_0_10px_#0087F6]">
					Run {data.name}
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
						{data.parameters.map((parameter) => {
							return (
								<fieldset key={parameter.id} className={clsx("grid gap-2")}>
									<label
										className="text-[14px] font-medium text-inverse"
										htmlFor={parameter.name}
									>
										{parameter.name}
										{parameter.required && (
											<span className="text-red-500 ml-1">*</span>
										)}
									</label>
									{parameter.type === "text" && (
										<input
											type="text"
											name={parameter.name}
											id={parameter.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[parameter.id]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
										/>
									)}
									{parameter.type === "multiline-text" && (
										<textarea
											name={parameter.name}
											id={parameter.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[parameter.id]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
											rows={4}
										/>
									)}
									{parameter.type === "number" && (
										<input
											type="number"
											name={parameter.name}
											id={parameter.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px]",
												validationErrors[parameter.id]
													? "border-red-500"
													: "border-border",
												"text-[14px]",
											)}
										/>
									)}
									{validationErrors[parameter.id] && (
										<span className="text-red-500 text-[12px] font-medium">
											{validationErrors[parameter.id]}
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
