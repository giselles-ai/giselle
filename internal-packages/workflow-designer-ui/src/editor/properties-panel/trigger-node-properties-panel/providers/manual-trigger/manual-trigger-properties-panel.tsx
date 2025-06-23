import {
	ManualTriggerParameter,
	ManualTriggerParameterId,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useGiselleEngine, useWorkflowDesigner } from "giselle-sdk/react";
import { PlusIcon, TrashIcon } from "lucide-react";
import {
	type FormEventHandler,
	useCallback,
	useState,
	useTransition,
} from "react";
import { SpinnerIcon } from "../../../../../icons";
import { ManualTriggerConfiguredView } from "../../ui";

export function ManualTriggerPropertiesPanel({ node }: { node: TriggerNode }) {
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();
	const [parameters, setParameters] = useState<ManualTriggerParameter[]>([]);

	const handleAddParameter = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			const formData = new FormData(e.currentTarget);
			const name = formData.get("name") as string;
			const type = formData.get("type") as string;
			const required = formData.get("required") !== null;

			const parse = ManualTriggerParameter.safeParse({
				id: ManualTriggerParameterId.generate(),
				name,
				type,
				required,
			});
			if (!parse.success) {
				/** @todo error handling */
				return;
			}
			setParameters((prev) => [...prev, parse.data]);
			e.currentTarget.reset();
		},
		[],
	);

	const handleRemoveParameter = useCallback((id: string) => {
		setParameters((prev) => prev.filter((param) => param.id !== id));
	}, []);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();
			if (parameters.length === 0) {
				/** @todo error handling */
				return;
			}

			const outputs: Output[] = parameters.map((param) => ({
				id: OutputId.generate(),
				label: param.name,
				accessor: param.id,
			}));

			startTransition(async () => {
				const { triggerId } = await client.configureTrigger({
					trigger: {
						nodeId: node.id,
						workspaceId: workspace?.id,
						enable: true,
						configuration: {
							provider: "manual",
							event: {
								id: "manual",
								parameters,
							},
						},
					},
				});

				updateNodeData(node, {
					content: {
						...node.content,
						state: {
							status: "configured",
							flowTriggerId: triggerId,
						},
					},
					outputs,
					name: "Manual Trigger",
				});
			});
		},
		[parameters, client, node, workspace?.id, updateNodeData],
	);

	if (node.content.state.status === "configured") {
		return <ManualTriggerConfiguredView node={node} />;
	}

	return (
		<div className="flex flex-col gap-[16px] px-[16px] py-[16px]">
			<p className="text-[18px]">Configure Manual Trigger Parameters</p>
			<p className="text-[14px]">
				Add parameters that will be requested when this flow is manually
				triggered.
			</p>

			<div className="flex flex-col gap-[8px]">
				<p className="text-[16px] font-medium">Parameters</p>

				{parameters.length > 0 ? (
					<div className="flex flex-col gap-[8px] mb-[16px]">
						{parameters.map((param) => (
							<div
								key={param.id}
								className="flex items-center justify-between p-[8px] bg-white-900/10 rounded-[4px]"
							>
								<div className="flex items-center gap-[8px]">
									<span className="font-medium">{param.name}</span>
									<span className="text-[12px] text-black-500">
										{param.type}
										{param.required ? " (required)" : ""}
									</span>
								</div>
								<button
									type="button"
									onClick={() => handleRemoveParameter(param.id)}
									className="text-black-500 hover:text-black-900"
								>
									<TrashIcon className="size-[16px]" />
								</button>
							</div>
						))}
					</div>
				) : (
					<div className="text-[14px] text-black-500 mb-[16px]">
						No parameters configured yet. Add at least one parameter.
					</div>
				)}

				<div className="flex flex-col gap-[8px] p-[12px] border border-white-800 rounded-[8px]">
					<p className="text-[14px] font-medium">Add New Parameter</p>
					<form
						className="flex gap-[8px] items-end"
						onSubmit={handleAddParameter}
					>
						<div className="flex-1">
							<label
								htmlFor="param-name"
								className="text-[12px] text-black-500 mb-[4px] block"
							>
								Parameter Name
							</label>
							<input
								id="param-name"
								name="name"
								type="text"
								placeholder="e.g., Title, Message, Priority"
								className={clsx(
									"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
									"border-[1px] border-white-900",
									"text-[14px]",
								)}
							/>
						</div>
						<div className="w-[100px]">
							<label
								htmlFor="param-type"
								className="text-[12px] text-black-500 mb-[4px] block"
							>
								Type
							</label>
							<select
								id="param-type"
								name="type"
								className={clsx(
									"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
									"border-[1px] border-white-900",
									"text-[14px]",
								)}
							>
								<option value="text">Text</option>
								<option value="multiline-text">Text (multi-line)</option>
								<option value="number">Number</option>
							</select>
						</div>
						<div className="flex items-center h-[42px] ml-[4px]">
							<label
								htmlFor="param-required"
								className="flex items-center gap-[4px] cursor-pointer"
							>
								<input id="param-required" type="checkbox" name="required" />
								<span className="text-[12px]">Required</span>
							</label>
						</div>
						<button
							type="submit"
							className="bg-white-800 text-black-900 h-[42px] w-[42px] rounded-[8px] flex items-center justify-center disabled:opacity-50"
						>
							<PlusIcon className="size-[18px]" />
						</button>
					</form>
				</div>
			</div>

			<form onSubmit={handleSubmit}>
				<button
					type="submit"
					className="h-[38px] rounded-[8px] bg-white-800 text-[14px] cursor-pointer text-black-800 font-[700] px-[16px] font-accent disabled:opacity-50 mt-[8px]"
					disabled={isPending}
				>
					{isPending ? (
						<div className="flex items-center justify-center gap-[8px]">
							<SpinnerIcon className="animate-follow-through-overlap-spin size-[18px]" />
							Configuring...
						</div>
					) : (
						"Save Configuration"
					)}
				</button>
			</form>
		</div>
	);
}
