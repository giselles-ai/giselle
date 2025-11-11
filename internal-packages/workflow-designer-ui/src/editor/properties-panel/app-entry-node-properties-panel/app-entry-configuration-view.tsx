import { Button } from "@giselle-internal/ui/button";
import { Select } from "@giselle-internal/ui/select";
import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import { SettingRow } from "@giselle-internal/ui/setting-row";
import {
	AppId,
	type DraftApp,
	type DraftAppParameter,
	DraftAppParameterId,
} from "@giselles-ai/protocol";
import { PlusIcon, TrashIcon } from "lucide-react";
import {
	type FormEventHandler,
	useCallback,
	useState,
	useTransition,
} from "react";
import { SpinnerIcon } from "../../../icons";

const TYPE_OPTIONS = [
	{ value: "text", label: "Text" },
	{ value: "multiline-text", label: "Text (multi-line)" },
	{ value: "number", label: "Number" },
];

export function AppEntryConfigurationView({
	draftApp,
}: {
	draftApp: DraftApp;
}) {
	const [isPending, startTransition] = useTransition();
	const [appName, setAppName] = useState(draftApp.name);
	const [appDescription, setAppDescription] = useState(draftApp.description);
	const [appIconName, setAppIconName] = useState<string>(draftApp.iconName);
	const [appParameters, setAppParameters] = useState<DraftAppParameter[]>(
		draftApp.parameters,
	);

	const handleAddParameter = useCallback(() => {
		setAppParameters((prev) => [
			...prev,
			{
				id: DraftAppParameterId.generate(),
				name: "",
				type: "text",
				required: false,
			},
		]);
	}, []);

	const handleRemoveParameter = useCallback(
		(parameterId: DraftAppParameterId) => {
			setAppParameters((prev) =>
				prev.filter((appParameter) => appParameter.id !== parameterId),
			);
		},
		[],
	);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			if (!appName.trim()) {
				/** @todo error handling */
				return;
			}

			startTransition(() => {
				const appId = AppId.generate();

				// TODO: Create App via API
				// For now, we'll create the app structure locally
				// This should be replaced with: await client.createApp({ app: { id: appId, name: appName, parameters } });
				// const app: App = {
				// 	id: appId,
				// 	name: appName,
				// 	description: "",
				// 	iconName: "",
				// 	parameters: parameterFormValues.map((parameterFormValue) => ({
				// 		id: AppParameterId.generate(),
				// 		name: parameterFormValue.name,
				// 		type: parameterFormValue.type,
				// 		required: parameterFormValue.required,
				// 	})),
				// };

				// const outputs: Output[] = app.parameters.map((param) => ({
				// 	id: OutputId.generate(),
				// 	label: param.name,
				// 	accessor: param.id,
				// }));

				// updateNodeDataContent(node, {
				// 	status: "configured",
				// 	appId,
				// } as Partial<typeof node.content>);
				// updateNodeData(node, {
				// 	outputs,
				// 	name: app.name,
				// });
			});
		},
		[appName],
	);

	return (
		<div className="flex flex-col gap-[8px] h-full px-1">
			<div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative space-y-[16px]">
				{/* App Basic Information */}
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">App Information</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
						<div className="space-y-[12px]">
							<SettingRow label={<SettingDetail>App Name</SettingDetail>}>
								<input
									id="app-name"
									type="text"
									placeholder="Enter app name"
									value={appName}
									onChange={(e) => setAppName(e.target.value)}
									className="w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px]"
									data-1p-ignore
								/>
							</SettingRow>

							<SettingRow label={<SettingDetail>Description</SettingDetail>}>
								<textarea
									id="app-description"
									placeholder="Enter app description"
									value={appDescription}
									onChange={(e) => setAppDescription(e.target.value)}
									className="w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px] resize-none"
									rows={3}
									data-1p-ignore
								/>
							</SettingRow>

							<SettingRow label={<SettingDetail>Icon Name</SettingDetail>}>
								<input
									id="app-icon-name"
									type="text"
									placeholder="Enter icon name"
									value={appIconName}
									onChange={(e) => setAppIconName(e.target.value)}
									className="w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px]"
									data-1p-ignore
								/>
							</SettingRow>
						</div>
					</div>
				</div>

				{/* Parameters */}
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">Parameters</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
						{appParameters.length > 0 && (
							<div className="flex flex-col gap-[12px] mb-[16px]">
								{appParameters.map((param, index) => (
									<div
										key={param.id}
										className="relative p-[12px] bg-bg-900/10 rounded-[8px] border border-border"
									>
										<div className="flex items-start justify-between mb-[12px]">
											<span className="text-[14px] font-medium">
												Parameter {index + 1}
											</span>
											{index > 0 && (
												<button
													type="button"
													onClick={() => handleRemoveParameter(param.id)}
													className="text-text hover:text-text transition-colors cursor-pointer"
												>
													<TrashIcon className="size-[16px]" />
												</button>
											)}
										</div>
										<div className="space-y-[12px]">
											<SettingRow label={<SettingDetail>Name *</SettingDetail>}>
												<input
													type="text"
													placeholder="Parameter name"
													value={param.name}
													onChange={(e) =>
														setAppParameters((prev) =>
															prev.map((p) =>
																p.id === param.id
																	? { ...p, name: e.target.value }
																	: p,
															),
														)
													}
													className="w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px]"
													data-1p-ignore
												/>
											</SettingRow>
											<SettingRow label={<SettingDetail>Type *</SettingDetail>}>
												<Select
													options={TYPE_OPTIONS}
													placeholder="Select type..."
													value={param.type}
													onValueChange={(value) =>
														setAppParameters((prev) =>
															prev.map((p) =>
																p.id === param.id
																	? {
																			...p,
																			type: value as
																				| "text"
																				| "multiline-text"
																				| "number",
																		}
																	: p,
															),
														)
													}
												/>
											</SettingRow>
											{index > 0 && (
												<SettingRow
													label={<SettingDetail>Optional</SettingDetail>}
												>
													<div className="flex items-center gap-[8px] h-[37px]">
														<input
															type="checkbox"
															checked={!param.required}
															onChange={(e) =>
																setAppParameters((prev) =>
																	prev.map((p) =>
																		p.id === param.id
																			? {
																					...p,
																					required: !e.target.checked,
																				}
																			: p,
																	),
																)
															}
														/>
														<span className="text-[12px] text-black-500">
															Optional field
														</span>
													</div>
												</SettingRow>
											)}
										</div>
									</div>
								))}
							</div>
						)}

						<div className="flex justify-end mb-[16px]">
							<Button
								type="button"
								variant="filled"
								onClick={handleAddParameter}
								leftIcon={<PlusIcon className="size-[14px]" />}
							>
								Add Parameter
							</Button>
						</div>
					</div>
				</div>

				<div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px] justify-end">
					<form onSubmit={handleSubmit} className="w-full flex justify-end">
						<Button
							type="submit"
							variant="solid"
							className="w-full"
							size="large"
							disabled={isPending || !appName.trim()}
							leftIcon={
								isPending && (
									<SpinnerIcon className="animate-follow-through-overlap-spin size-[18px]" />
								)
							}
						>
							<span>{isPending ? "Creating..." : "Create App"}</span>
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
