import { Button } from "@giselle-internal/ui/button";
import { Select } from "@giselle-internal/ui/select";
import { Toggle } from "@giselle-internal/ui/toggle";
import {
	ManualTriggerParameter,
	ManualTriggerParameterId,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselle-sdk/data-type";
import {
	useFeatureFlag,
	useFlowTrigger,
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import { TrashIcon } from "lucide-react";
import {
	type FormEventHandler,
	useCallback,
	useState,
	useTransition,
} from "react";
import { SpinnerIcon } from "../../../../../icons";
import { ManualTriggerConfiguredView } from "../../ui";

const TYPE_OPTIONS = [
	{ id: "text", name: "Text" },
	{ id: "multiline-text", name: "Text (multi-line)" },
	{ id: "number", name: "Number" },
];

export function ManualTriggerPropertiesPanel({ node }: { node: TriggerNode }) {
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();
	const [parameters, setParameters] = useState<ManualTriggerParameter[]>([]);
	const [staged, setStaged] = useState(false);
	const { experimental_storage, stage } = useFeatureFlag();
	const { callbacks } = useFlowTrigger();

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
		(e) => {
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
							staged,
						},
					},
					useExperimentalStorage: experimental_storage,
				});

				await callbacks?.flowTriggerUpdate?.({
					id: triggerId,
					nodeId: node.id,
					workspaceId: workspace?.id,
					enable: true,
					configuration: {
						provider: "manual",
						event: {
							id: "manual",
							parameters,
						},
						staged,
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
					name: node.name,
				});
			});
		},
		[
			parameters,
			staged,
			client,
			node,
			workspace?.id,
			updateNodeData,
			callbacks?.flowTriggerUpdate,
			experimental_storage,
		],
	);

	if (node.content.state.status === "configured") {
		return <ManualTriggerConfiguredView node={node} />;
	}

	return (
		<div className="flex flex-col gap-[8px] h-full px-1">
			<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative space-y-[16px]">
				<div className="space-y-[4px]">
					<p className="text-[14px] py-[1.5px]">Parameter</p>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
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
							<div className="text-[14px] text-text-muted mb-[16px]">
								No parameters configured yet. Add at least one parameter.
							</div>
						)}
					</div>

					<div className="space-y-[4px] mt-[16px]">
						<div className="flex flex-col gap-[8px] rounded-[8px]">
							<form
								className="grid grid-cols-[1fr_120px_auto_auto] gap-x-4 gap-y-1 items-end"
								onSubmit={handleAddParameter}
							>
								<label
									htmlFor="param-name"
									className="text-[12px] text-black-500"
								>
									Parameter Name
								</label>
								<label
									htmlFor="param-type"
									className="text-[12px] text-black-500"
								>
									Type
								</label>
								<label
									htmlFor="param-required"
									className="text-[12px] text-black-500"
								>
									Required
								</label>
								<div />
								<input
									id="param-name"
									name="name"
									type="text"
									placeholder="Write the parameter name"
									className="w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-[1px] border-white-900 text-[14px]"
									data-1p-ignore
								/>
								<Select
									name="type"
									options={TYPE_OPTIONS}
									renderOption={(option) => option.name}
									placeholder="Select type..."
									defaultValue="text"
								/>
								<div className="flex items-center justify-center h-[37px]">
									<input id="param-required" type="checkbox" name="required" />
								</div>
								<Button type="submit" variant="filled" size="large">
									Add
								</Button>
							</form>
						</div>
					</div>
				</div>

				<div className="space-y-[4px]">
					<p className="text-[14px] py-[1.5px]">Staged</p>
					{stage && (
						<div className="mt-[8px]">
							<Toggle
								name="staged"
								checked={staged}
								onCheckedChange={setStaged}
							>
								<label className="text-[12px]" htmlFor="staged">
									Enable this trigger to run in Stage
									<span className="text-text-muted ml-[8px]">
										(This can be changed later)
									</span>
								</label>
								<div className="flex-grow mx-[12px] h-[1px] bg-element-background" />
							</Toggle>
						</div>
					)}
				</div>

				<div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px]">
					<form onSubmit={handleSubmit} className="w-full">
						<Button
							type="submit"
							variant="solid"
							size="large"
							disabled={isPending}
							leftIcon={
								isPending && (
									<SpinnerIcon className="animate-follow-through-overlap-spin size-[18px]" />
								)
							}
						>
							<span>{isPending ? "Setting up..." : "Save Configuration"}</span>
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
