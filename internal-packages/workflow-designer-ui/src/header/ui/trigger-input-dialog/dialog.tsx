import {
	type ActionNode,
	type Input,
	type TriggerNode,
	isActionNode,
} from "@giselle-sdk/data-type";
import { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import { clsx } from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { AlertTriangleIcon, PlayIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { type FormEventHandler, useCallback, useMemo, useState } from "react";
import { useFlowController } from "../../../hooks/use-flow-controller";
import { useTrigger } from "../../../hooks/use-trigger";
import { Button } from "./button";
import {
	type FormInput,
	buttonLabel,
	createInputsFromTrigger,
	parseFormInputs,
} from "./helpers";

export function TriggerInputDialog({
	node,
	onClose,
}: { node: TriggerNode; onClose: () => void }) {
	const { data: trigger, isLoading } = useTrigger(node);
	const { data } = useWorkflowDesigner();

	const inputs = useMemo<FormInput[]>(
		() => createInputsFromTrigger(trigger),
		[trigger],
	);

	const flow = useMemo(
		() => buildWorkflowFromNode(node.id, data.nodes, data.connections),
		[node.id, data.nodes, data.connections],
	);

	const requiresActionNodes = useMemo(
		() =>
			flow === null
				? []
				: flow.nodes
						.filter((n) => isActionNode(n, "github"))
						.map((n) => {
							const notConnectedRequiredInputs = n.inputs.filter(
								(input) =>
									input.isRequired &&
									!data.connections.some(
										(connection) => connection.inputId === input.id,
									),
							);
							if (notConnectedRequiredInputs.length === 0) {
								return null;
							}
							return {
								node: n as ActionNode,
								inputs: notConnectedRequiredInputs,
							};
						})
						.filter(
							(item): item is { node: ActionNode; inputs: Input[] } =>
								item !== null,
						),
		[flow, data.connections],
	);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { startFlow } = useFlowController();

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
				await startFlow(flow, inputs, values, onClose);
			} finally {
				setIsSubmitting(false);
			}
		},
		[inputs, onClose, flow, startFlow],
	);

	if (isLoading || flow === null) {
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
							className="text-white-400 hover:text-white-900 outline-none"
						>
							<XIcon className="size-[20px]" />
						</button>
					</Dialog.Close>
				</div>
			</div>
			<div className="flex flex-col h-full">
				<form
					className="flex-1 flex flex-col gap-[14px] relative text-white-800 overflow-y-hidden"
					onSubmit={handleSubmit}
				>
					<p className="text-[12px] mb-[8px] text-black-400 font-sans font-semibold">
						Execute this workflow with custom input values
					</p>

					{requiresActionNodes.length > 0 && (
						<div className="bg-red-50 rounded-[6px] p-[10px]">
							<div className="flex items-start gap-[8px]">
								<div className="text-red-500 mt-[2px]">
									<AlertTriangleIcon className="size-[16px] text-red-700" />
								</div>
								<div className="flex-1">
									<h4 className="text-red-800 font-medium text-[14px] mb-[4px]">
										Missing Required Connections
									</h4>
									<p className="text-red-700 text-[12px] mb-[8px]">
										The following action nodes have required inputs that are not
										connected:
									</p>
									<ul className="space-y-[4px]">
										{requiresActionNodes.map((item) => (
											<li
												key={item.node.id}
												className="text-red-700 text-[12px]"
											>
												<span className="font-medium">
													{item.node.name || "Unnamed Action"}
												</span>{" "}
												- Missing:{" "}
												{item.inputs.map((input) => input.label).join(", ")}
											</li>
										))}
									</ul>
									<p className="text-red-700 text-[12px] mt-[8px]">
										Please connect all required inputs in the workflow designer
										before running.
									</p>
								</div>
							</div>
						</div>
					)}

					<div className="flex flex-col gap-[8px]">
						{inputs.map((input) => {
							return (
								<fieldset key={input.name} className={clsx("grid gap-2")}>
									<label
										className="text-[14px] font-medium text-white-900"
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
													: "border-white-900",
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
													: "border-white-900",
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
													: "border-white-900",
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
							type="submit"
							loading={isSubmitting}
							disabled={requiresActionNodes.length > 0}
							leftIcon={<PlayIcon className="size-[14px] fill-black-900" />}
						>
							{isSubmitting
								? "Running..."
								: requiresActionNodes.length > 0
									? "Fix Connections to Run"
									: "Run"}
						</Button>
					</div>
				</form>
			</div>
		</>
	);
}
