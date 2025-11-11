import { Button } from "@giselle-internal/ui/button";
import { Select } from "@giselle-internal/ui/select";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import { SettingRow } from "@giselle-internal/ui/setting-row";
import { Toggle } from "@giselle-internal/ui/toggle";
import {
	useFeatureFlag,
	useGiselleEngine,
	useTrigger,
	useWorkflowDesigner,
} from "@giselles-ai/giselle/react";
import {
	ManualTriggerParameter,
	ManualTriggerParameterId,
	type Output,
	OutputId,
	type TriggerNode,
} from "@giselles-ai/protocol";
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
	{ value: "text", label: "Text" },
	{ value: "multiline-text", label: "Text (multi-line)" },
	{ value: "number", label: "Number" },
];

export function ManualTriggerPropertiesPanel({ node }: { node: TriggerNode }) {
	const { data: workspace, updateNodeData } = useWorkflowDesigner();
	const client = useGiselleEngine();
	const [isPending, startTransition] = useTransition();
	const [parameters, setParameters] = useState<ManualTriggerParameter[]>([]);
	const [staged, setStaged] = useState(false);
	const { stage } = useFeatureFlag();
	const { callbacks } = useTrigger();

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
				});

				await callbacks?.triggerUpdate?.({
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
			callbacks?.triggerUpdate,
		],
	);

	if (node.content.state.status === "configured") {
		return <ManualTriggerConfiguredView node={node} />;
	}

	return (
		<div className="flex flex-col gap-[8px] h-full px-1">
			<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative space-y-[16px]">
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">Parameter</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
						{parameters.length > 0 ? (
							<div className="flex flex-col mb-[16px]">
								{parameters.map((param) => (
									<div
										key={param.id}
										className="flex items-center justify-between p-[8px] bg-bg-900/10 rounded-[4px]"
									>
										<div className="flex items-center gap-[8px]">
											<span className="font-medium">{param.name}</span>
											<span className="text-[12px] text-text-muted">
												{param.type}
											</span>
											{param.required ? (
												<span className="text-[12px] text-error-900 ml-[4px]">
													(required)
												</span>
											) : null}
										</div>
										<button
											type="button"
											onClick={() => handleRemoveParameter(param.id)}
											className="text-text-muted hover:text-text transition-colors"
										>
											<TrashIcon className="size-[16px]" />
										</button>
									</div>
								))}
							</div>
						) : (
							<div className="text-[12px] text-text-muted/80 mb-[16px] bg-transparent p-0 rounded-none">
								No parameters configured yet. Add at least one parameter.
							</div>
						)}
					</div>

					<div className="space-y-[4px] mt-[16px]">
						<div className="flex flex-col gap-[8px] rounded-[8px]">
							<form
								className="flex flex-col gap-[12px]"
								onSubmit={handleAddParameter}
							>
								<SettingLabel className="py-[1.5px]">Setting</SettingLabel>
								<SettingRow
									label={<SettingDetail>Parameter name</SettingDetail>}
								>
									<input
										id="param-name"
										name="name"
										type="text"
										placeholder="Write the parameter name"
										className="w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px]"
										data-1p-ignore
									/>
								</SettingRow>

								<SettingRow label={<SettingDetail>Type</SettingDetail>}>
									<Select
										name="type"
										options={TYPE_OPTIONS}
										placeholder="Select type..."
										defaultValue="text"
									/>
								</SettingRow>

								<SettingRow label={<SettingDetail>Required</SettingDetail>}>
									<div className="flex items-center gap-[8px] h-[37px]">
										<input
											id="param-required"
											type="checkbox"
											name="required"
										/>
										<span className="text-[12px] text-black-500">
											This parameter is required
										</span>
									</div>
								</SettingRow>

								<div className="flex justify-end">
									<Button type="submit" variant="filled" size="large">
										Add
									</Button>
								</div>
							</form>
						</div>
					</div>
				</div>

				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">Staged</SettingLabel>
					{
						// This component is ManualTriggerPropertiesPanel, so it's obvious that the provider is manual, but this component is also used by app-entry provider, and in that case this UI is unnecessary, so we include this conditional check.
						stage && node.content.provider === "manual" && (
							<div className="mt-[8px]">
								<div className="flex flex-row items-center justify-between">
									<SettingDetail>
										Enable this trigger to run in Stage
									</SettingDetail>
									<Toggle
										name="staged"
										checked={staged}
										onCheckedChange={setStaged}
									/>
								</div>
								<p className="text-[12px] text-text-muted mt-[4px]">
									(This can be changed later)
								</p>
							</div>
						)
					}
				</div>

				<div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px] justify-end">
					<form onSubmit={handleSubmit} className="w-full flex justify-end">
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
